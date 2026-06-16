'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Float } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/superseedmodel.glb'
const TARGET_HEIGHT = 2.2 // world-units tall once normalized
const MAX_WIDTH_FRAC = 0.82 // never let the model span more than this much of the viewport width
const BASE_YAW = -0.6 // pleasant 3/4 rest view (matches the background floating model)
const AUTO_SPIN = 0.25 // radians/sec idle turntable rotation, paused while dragging

function Model({ reduce }: { reduce: boolean }) {
  const { scene } = useGLTF(MODEL_URL)
  const spin = useRef<THREE.Group>(null)
  const dragging = useRef(false)
  const { viewport } = useThree()
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  // Clone + normalize: recenter on the origin and scale to a consistent height.
  const { object, baseScale, baseWidth } = useMemo(() => {
    const obj = scene.clone(true)
    const box = new THREE.Box3().setFromObject(obj)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    obj.position.set(-center.x, -center.y, -center.z)
    const s = TARGET_HEIGHT / size.y
    // max(x, z) so the width cap still holds at any spin angle
    return { object: obj, baseScale: s, baseWidth: Math.max(size.x, size.z) * s }
  }, [scene])

  // Shrink on narrow screens so the model never overflows the frame.
  const fitScale = useMemo(
    () => Math.min(1, (MAX_WIDTH_FRAC * viewport.width) / baseWidth),
    [viewport.width, baseWidth],
  )

  // Drag-to-spin bound straight to the canvas element (same approach as the hero
  // and background tractors): raycasting onto the thin model silhouette is
  // unreliable, so we capture the pointer on the canvas. A drag rotates the
  // turntable; releasing resumes the slow idle spin.
  useEffect(() => {
    const el = gl.domElement
    const drag = { active: false, id: -1, sx: 0, sy: 0, baseY: 0, baseX: 0 }
    const onDown = (e: PointerEvent) => {
      const g = spin.current
      if (!g) return
      dragging.current = true
      drag.active = true
      drag.id = e.pointerId
      drag.sx = e.clientX
      drag.sy = e.clientY
      drag.baseY = g.rotation.y
      drag.baseX = g.rotation.x
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
      el.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      const g = spin.current
      if (!drag.active || drag.id !== e.pointerId || !g) return
      g.rotation.y = drag.baseY + (e.clientX - drag.sx) * 0.01
      g.rotation.x = THREE.MathUtils.clamp(drag.baseX + (e.clientY - drag.sy) * 0.005, -0.35, 0.45)
      invalidate() // render the new rotation even when frameloop is 'demand'
    }
    const onUp = (e: PointerEvent) => {
      if (!drag.active) return
      drag.active = false
      dragging.current = false
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {}
      el.style.cursor = 'grab'
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
  }, [gl, invalidate])

  // Idle turntable — keep turning slowly until the user grabs it.
  useFrame((_, delta) => {
    if (reduce || dragging.current) return
    if (spin.current) spin.current.rotation.y += AUTO_SPIN * delta
  })

  return (
    <group ref={spin} rotation={[0, BASE_YAW, 0]} scale={baseScale * fitScale}>
      <Float
        enabled={!reduce}
        speed={reduce ? 0 : 2}
        rotationIntensity={reduce ? 0 : 0.2}
        floatIntensity={reduce ? 0 : 0.5}
        floatingRange={[-0.1, 0.1]}
      >
        <primitive object={object} />
      </Float>
    </group>
  )
}

export default function AboutModel({ reduce = false }: { reduce?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0.4, 8], fov: 35 }}
      frameloop={reduce ? 'demand' : 'always'}
      style={{ touchAction: 'pan-y' }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#cfe3f0', '#4f7a2f', 0.6]} />
      <directionalLight position={[-7, 11, 6]} intensity={1.3} color="#fff3d6" />
      <directionalLight position={[6, 3, 7]} intensity={0.5} color="#ffffff" />
      <Suspense fallback={null}>
        <Model reduce={reduce} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
