'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Float } from '@react-three/drei'
import type { MotionValue } from 'framer-motion'
import * as THREE from 'three'

const MODEL_URL = '/base_basic_shaded.glb'
const TARGET_HEIGHT = 1.5 // world-units tall once normalized (smaller background prop)
const MAX_WIDTH_FRAC = 0.6 // most of the viewport width the tractor may span (shrinks it on narrow screens)
const ZIGZAG_CYCLES = 3 // how many left-right weaves across the full scroll
const BASE_YAW = -0.6 // pleasant 3/4 rest view of the tractor
const Y_TOP = 1.6 // world-units: rest position at scroll start (upper, full body in view)
const Y_LOW = -1.6 // world-units: lowest point of the descent through the content
const Y_PARK = 0.6 // world-units: lifted park position so it rests ABOVE the footer
const P_PARK = 0.8 // scroll progress at which it starts lifting up to park
const DAMP = 0.08 // per-frame easing toward the target (smooth, springy follow)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

function Rig({ progress, reduce }: { progress: MotionValue<number>; reduce: boolean }) {
  const { scene } = useGLTF(MODEL_URL)
  const outer = useRef<THREE.Group>(null)
  const { size, viewport } = useThree()
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  // Clone + normalize: recenter and scale the model to a consistent height.
  const { object, baseScale, baseWidth } = useMemo(() => {
    const obj = scene.clone(true)
    const box = new THREE.Box3().setFromObject(obj)
    const s = new THREE.Vector3()
    const c = new THREE.Vector3()
    box.getSize(s)
    box.getCenter(c)
    obj.position.set(-c.x, -c.y, -c.z)
    const bScale = TARGET_HEIGHT / s.y
    // max(x, z) so the width cap still holds when the user spins the long axis toward the camera
    return { object: obj, baseScale: bScale, baseWidth: Math.max(s.x, s.z) * bScale }
  }, [scene])

  // Shrink the model on narrow screens so it never spans more than MAX_WIDTH_FRAC of the
  // viewport. Clamped to 1× so wide/desktop screens render at the natural size, unchanged.
  const fitScale = useMemo(
    () => Math.min(1, (MAX_WIDTH_FRAC * viewport.width) / baseWidth),
    [viewport.width, baseWidth],
  )

  // Scroll-driven target, the user-applied drag offset, and the smoothed actual
  // position (frame-damped toward target+offset so motion always reads as fluid).
  const target = useRef(new THREE.Vector3())
  const pos = useRef(new THREE.Vector3())
  const inited = useRef(false)
  const userOffset = useRef(new THREE.Vector3())
  const interacting = useRef(false)
  // Group the user spins by dragging — gives a full 360° view of the tractor.
  const spinRef = useRef<THREE.Group>(null)

  // Drag handling bound straight to the canvas element (not the model). Like the
  // hero tractor, raycasting onto the thin, bobbing silhouette almost never
  // registered with PresentationControls — so we capture the pointer on the
  // canvas itself: a plain drag spins the tractor a full 360°, while a
  // shift-drag, right-button drag, or two-finger drag repositions it instead.
  useEffect(() => {
    const el = gl.domElement
    const worldPerPx = () => viewport.width / Math.max(1, size.width)
    let activePointers = 0
    const drag = { active: false, id: -1, mode: 'spin' as 'spin' | 'move', lastX: 0, lastY: 0, baseY: 0, baseX: 0 }
    const onDown = (e: PointerEvent) => {
      const g = spinRef.current
      if (!g) return
      activePointers += 1
      if (drag.active) return // ignore extra fingers once a gesture owns the drag
      interacting.current = true // pause the auto scroll-driven float while held
      drag.active = true
      drag.id = e.pointerId
      drag.mode = e.shiftKey || e.button === 2 || activePointers >= 2 ? 'move' : 'spin'
      drag.lastX = e.clientX
      drag.lastY = e.clientY
      drag.baseY = g.rotation.y
      drag.baseX = g.rotation.x
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
      el.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      if (!drag.active || drag.id !== e.pointerId) return
      if (drag.mode === 'move') {
        const k = worldPerPx()
        userOffset.current.x += (e.clientX - drag.lastX) * k
        userOffset.current.y -= (e.clientY - drag.lastY) * k
        drag.lastX = e.clientX
        drag.lastY = e.clientY
      } else {
        const g = spinRef.current
        if (!g) return
        g.rotation.y = drag.baseY + (e.clientX - drag.lastX) * 0.01 // full 360° spin
        g.rotation.x = THREE.MathUtils.clamp(drag.baseX + (e.clientY - drag.lastY) * 0.005, -0.35, 0.45)
      }
      invalidate() // render the new rotation even when frameloop is 'demand'
    }
    const onUp = (e: PointerEvent) => {
      activePointers = Math.max(0, activePointers - 1)
      if (!drag.active || drag.id !== e.pointerId) return
      drag.active = false
      interacting.current = false // auto float/descent resumes
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {}
      el.style.cursor = 'grab'
      invalidate()
    }
    el.style.cursor = 'grab' // signal it's grabbable so the 360° view is discoverable
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('lostpointercapture', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('lostpointercapture', onUp)
    }
  }, [gl, invalidate, size.width, viewport.width])

  useFrame((state) => {
    const g = outer.current
    if (!g) return

    // Scroll-driven base stays within the visible band so the whole tractor is
    // always on screen: descends through the content, then lifts to a parked
    // spot ABOVE the footer over the last stretch (never sinks behind it).
    if (!interacting.current && !reduce) {
      const p = clamp01(progress.get())
      const y =
        p <= P_PARK
          ? lerp(Y_TOP, Y_LOW, easeInOut(p / P_PARK))
          : lerp(Y_LOW, Y_PARK, easeInOut((p - P_PARK) / (1 - P_PARK)))
      target.current.set(
        Math.sin(p * Math.PI * ZIGZAG_CYCLES) * (state.viewport.width * 0.22),
        y,
        0,
      )
    }
    // Apply the user's drag offset on top of the scroll base.
    const tx = target.current.x + userOffset.current.x
    const ty = target.current.y + userOffset.current.y
    const tz = target.current.z + userOffset.current.z

    if (!inited.current) {
      pos.current.set(tx, ty, tz) // start in place — no jump-in
      inited.current = true
    } else {
      // Frame-damped easing toward the target → smooth, fluid movement.
      pos.current.x += (tx - pos.current.x) * DAMP
      pos.current.y += (ty - pos.current.y) * DAMP
      pos.current.z += (tz - pos.current.z) * DAMP
    }
    g.position.copy(pos.current)
  })

  return (
    <group ref={outer}>
      {/* spinRef is rotated by the canvas drag handler above for the 360° view;
          kept outside <Float> so the idle hover and the user's spin compose. */}
      <group ref={spinRef} rotation={[0, BASE_YAW, 0]} scale={baseScale * fitScale}>
        <Float
          enabled={!reduce}
          speed={reduce ? 0 : 2}
          rotationIntensity={reduce ? 0 : 0.25}
          floatIntensity={reduce ? 0 : 0.6}
          floatingRange={[-0.12, 0.12]}
        >
          <primitive object={object} />
        </Float>
      </group>
    </group>
  )
}

export default function FloatingModel({
  progress,
  reduce = false,
}: {
  progress: MotionValue<number>
  reduce?: boolean
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 10], fov: 35 }}
      frameloop={reduce ? 'demand' : 'always'}
      // allow vertical page scroll over the full-page canvas; horizontal/grab drags rotate
      style={{ touchAction: 'pan-y' }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      {/* Lower flat ambient + a stronger directional key (and a soft fill) give the
          pale model real light-and-shadow contrast so it stays clearly visible against
          the cream page background below the hero — instead of washing out / fading. */}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#cfe3f0', '#3d6b24', 0.5]} />
      <directionalLight position={[-7, 11, 6]} intensity={1.7} color="#fff3d6" />
      <directionalLight position={[6, 3, 7]} intensity={0.6} color="#ffffff" />
      <Suspense fallback={null}>
        <Rig progress={progress} reduce={reduce} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
