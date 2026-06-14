'use client'

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Cloud, Clouds, Float } from '@react-three/drei'
import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * Animation timeline (seconds from first frame)
 *  - Tractor drives in from the left and parks on the right
 *  - Once parked, the rice grows from the soil up to full height
 *  - After that everything just keeps waving / drifting forever
 * ------------------------------------------------------------------ */
const T_DRIVE_START = 0.6
const T_DRIVE_DUR = 6.2
const T_PARK = T_DRIVE_START + T_DRIVE_DUR
const T_GROW_START = T_PARK + 0.5
const T_GROW_DUR = 3.4

const START_X = -15
const PARK_X = 4.6
const TRACTOR_Z = 0.4
const TARGET_HEIGHT = 2.6
const FLOAT_H = 0.5 // how high the tractor lifts once it parks

// The model's length runs along its local Z axis. Rotate it so the long
// axis points along +X (its direction of travel). Flip the sign if the
// tractor ends up facing away from its movement.
const MODEL_YAW = Math.PI / 2

const MODEL_URL = '/base_basic_shaded.glb'

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/* ------------------------------------------------------------------ *
 * Grass / rice field — instanced blades with a wind + growth shader
 * ------------------------------------------------------------------ */
const GRASS_COUNT = 5200

const grassVertex = /* glsl */ `
  uniform float uTime;
  uniform float uGrow;
  uniform float uWind;
  varying float vH;

  void main() {
    vec3 ipos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

    // per-blade random so the field grows in a soft, staggered wave
    float rnd = fract(sin(dot(ipos.xz, vec2(12.9898, 78.233))) * 43758.5453);
    float g = clamp((uGrow - rnd * 0.35) / 0.65, 0.0, 1.0);
    g = smoothstep(0.0, 1.0, g);

    vec3 pos = position;
    vH = position.y;            // 0 at root, 1 at tip
    pos.y *= g;                 // grow up out of the ground

    // light breeze — tip sways more than the root
    float bend = vH * vH * uWind * g;
    float w = sin(uTime * 1.5 + ipos.x * 0.5 + ipos.z * 0.6)
            + 0.5 * sin(uTime * 2.7 + ipos.z * 0.9);
    pos.x += w * bend;
    pos.z += 0.4 * cos(uTime * 1.2 + ipos.x * 0.7) * bend;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`

const grassFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uTip;
  varying float vH;

  void main() {
    vec3 col = mix(uBase, uTip, smoothstep(0.0, 1.0, vH));
    gl_FragColor = vec4(col, 1.0);
  }
`

function RiceField({ animate }: { animate: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.075, 1, 1, 5)
    g.translate(0, 0.5, 0) // pivot at the root
    return g
  }, [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: grassVertex,
        fragmentShader: grassFragment,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uGrow: { value: animate ? 0 : 1 },
          uWind: { value: 0.16 },
          uBase: { value: new THREE.Color('#2f6e2c') },
          uTip: { value: new THREE.Color('#7ec24c') },
        },
      }),
    [animate],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < GRASS_COUNT; i++) {
      const x = THREE.MathUtils.randFloatSpread(27)
      const z = -13 + Math.random() * 16
      const h = 0.55 + Math.random() * 0.85
      const w = 0.7 + Math.random() * 0.6
      dummy.position.set(x, 0, z)
      dummy.rotation.set(0, Math.random() * Math.PI, 0)
      dummy.scale.set(w, h, w)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.frustumCulled = false
  }, [])

  useFrame((state) => {
    if (!animate) return
    const t = state.clock.elapsedTime
    material.uniforms.uTime.value = t
    material.uniforms.uGrow.value = clamp01((t - T_GROW_START) / T_GROW_DUR)
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, GRASS_COUNT]}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Tractor — drives in from the left, parks on the right
 * ------------------------------------------------------------------ */
function Tractor({ animate }: { animate: boolean }) {
  const { scene } = useGLTF(MODEL_URL)
  const travelRef = useRef<THREE.Group>(null)
  const liftRef = useRef<THREE.Group>(null)
  const parkedRef = useRef(false)
  const [parked, setParked] = useState(false)

  const { object, scale, footWidth, footLength } = useMemo(() => {
    const obj = scene.clone(true)
    const box = new THREE.Box3().setFromObject(obj)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const s = TARGET_HEIGHT / size.y
    // recenter on x/z, keep base on the ground
    obj.position.set(-center.x, -box.min.y, -center.z)
    return {
      object: obj,
      scale: s,
      footWidth: size.x * s,
      footLength: size.z * s,
    }
  }, [scene])

  const shadowTexture = useMemo(() => makeRadialTexture(), [])

  // Group the user spins by dragging. Kept separate from <Float> so the gentle
  // idle hover and the user's rotation compose instead of fighting each other.
  const spinRef = useRef<THREE.Group>(null)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  // Drag-to-spin. Bound straight to the canvas element rather than to the model:
  // the old PresentationControls needed the pointer to raycast onto the thin,
  // bobbing tractor silhouette, which almost never registered. We capture the
  // pointer on the canvas so the gesture keeps tracking even when it leaves the
  // canvas (and the browser can't steal it mid-drag), and call invalidate() on
  // every move so the 'demand' frameloop (reduced motion) actually re-renders.
  // touch-action:pan-y (on the Canvas) still lets vertical swipes scroll.
  useEffect(() => {
    const el = gl.domElement
    const drag = { active: false, id: -1, sx: 0, sy: 0, baseY: 0, baseX: 0 }
    const onDown = (e: PointerEvent) => {
      const g = spinRef.current
      if (!g) return
      // Don't make the user wait out the drive-in: first grab snaps it parked.
      if (!parkedRef.current) {
        parkedRef.current = true
        setParked(true)
      }
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
      const g = spinRef.current
      if (!drag.active || drag.id !== e.pointerId || !g) return
      g.rotation.y = drag.baseY + (e.clientX - drag.sx) * 0.01
      g.rotation.x = THREE.MathUtils.clamp(drag.baseX + (e.clientY - drag.sy) * 0.005, -0.35, 0.45)
      invalidate() // render the new rotation even when frameloop is 'demand'
    }
    const onUp = (e: PointerEvent) => {
      if (!drag.active) return
      drag.active = false
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {}
      el.style.cursor = 'grab'
      invalidate()
    }
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

  // Signal it's grabbable from the start so the 360° view is discoverable.
  useEffect(() => {
    gl.domElement.style.cursor = 'grab'
  }, [gl])

  // park position that keeps the tractor fully on screen at any aspect ratio
  const computeParkX = (camera: THREE.PerspectiveCamera, w: number, h: number) => {
    const dist = camera.position.z - TRACTOR_Z
    const halfH = Math.tan(((camera.fov || 42) * Math.PI) / 360) * dist
    const halfW = halfH * (w / Math.max(1, h))
    return Math.min(PARK_X, halfW - footLength / 2 - 0.5)
  }

  useFrame((state) => {
    const g = travelRef.current
    const lift = liftRef.current
    if (!g || !lift) return
    const camera = state.camera as THREE.PerspectiveCamera
    const targetX = computeParkX(camera, state.size.width, state.size.height)

    if (!animate) {
      g.position.set(targetX, 0, TRACTOR_Z)
      lift.position.y = FLOAT_H
      if (!parkedRef.current) {
        parkedRef.current = true
        setParked(true)
      }
      return
    }

    const t = state.clock.elapsedTime
    const p = easeInOut(clamp01((t - T_DRIVE_START) / T_DRIVE_DUR))
    g.position.x = THREE.MathUtils.lerp(START_X, targetX, p)
    g.position.z = TRACTOR_Z

    if (p < 1) {
      // driving — engine vibration on the ground
      lift.position.y = p > 0 ? Math.sin(t * 26) * 0.012 : 0
    } else {
      // parked — ease up into a gentle hover
      lift.position.y = THREE.MathUtils.lerp(lift.position.y, FLOAT_H, 0.04)
      if (!parkedRef.current) {
        parkedRef.current = true
        setParked(true)
      }
    }
  })

  const floatActive = parked && animate

  return (
    <group ref={travelRef} position={[START_X, 0, TRACTOR_Z]}>
      {/* soft contact shadow stays on the ground in the resting orientation */}
      <group rotation={[0, MODEL_YAW, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} raycast={() => null}>
          <planeGeometry args={[footWidth * 1.9, footLength * 1.25]} />
          <meshBasicMaterial
            map={shadowTexture}
            transparent
            opacity={parked ? 0.28 : 0.4}
            depthWrite={false}
            color="#163a1f"
          />
        </mesh>
      </group>

      {/* lifts off the ground once parked, then floats + can be dragged to view in 3D */}
      <group ref={liftRef}>
        <Float
          enabled={floatActive}
          speed={floatActive ? 2 : 0}
          rotationIntensity={floatActive ? 0.35 : 0}
          floatIntensity={floatActive ? 0.8 : 0}
          floatingRange={[-0.12, 0.12]}
        >
          {/* spinRef is rotated by the drag handler above for the 360° view */}
          <group ref={spinRef}>
            <group rotation={[0, MODEL_YAW, 0]} scale={scale}>
              <primitive object={object} />
            </group>
          </group>
        </Float>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ *
 * Sky props — drifting clouds + flying birds, drawn as billboard sprites
 * ------------------------------------------------------------------ */
function makeRadialTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.6, 'rgba(255,255,255,0.5)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeBirdTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  ctx.strokeStyle = 'rgba(22,30,24,1)'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(4, 42)
  ctx.quadraticCurveTo(22, 14, 32, 32) // left wing
  ctx.quadraticCurveTo(42, 14, 60, 42) // right wing
  ctx.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

type CloudDef = {
  x: number
  y: number
  z: number
  bounds: [number, number, number]
  volume: number
  segments: number
  opacity: number
  billow: number // internal puff animation
  drift: number // horizontal travel across the sky
  seed: number
  color: string
}

// darker, shaded cloud bodies + slightly brighter highlight chunks on top
const CLOUD_BODY = '#aebfce' // grey-blue shaded cloud body
const CLOUD_HAZE = '#b3c2d0' // darker horizon haze
const CLOUD_LIGHT = '#cfdae6' // toned-down highlight chunks

const CLOUDS: CloudDef[] = [
  // high, full clouds
  { x: -13, y: 7.4, z: -15, bounds: [7, 1.8, 2.5], volume: 7, segments: 38, opacity: 0.92, billow: 0.16, drift: 0.3, seed: 1, color: CLOUD_BODY },
  { x: -2, y: 8.6, z: -18, bounds: [9.5, 2.4, 3], volume: 10, segments: 46, opacity: 0.9, billow: 0.1, drift: 0.2, seed: 2, color: CLOUD_BODY },
  { x: 9, y: 7.6, z: -14, bounds: [6, 1.6, 2], volume: 6, segments: 30, opacity: 0.92, billow: 0.2, drift: 0.38, seed: 3, color: CLOUD_BODY },
  { x: 16, y: 8.8, z: -17, bounds: [8, 2.1, 2.6], volume: 8, segments: 40, opacity: 0.9, billow: 0.13, drift: 0.26, seed: 4, color: CLOUD_BODY },
  // smaller mid-sky chunks
  { x: -8, y: 6.1, z: -12, bounds: [4, 1.2, 1.6], volume: 4, segments: 22, opacity: 0.88, billow: 0.24, drift: 0.34, seed: 5, color: CLOUD_BODY },
  { x: 4, y: 6.5, z: -11, bounds: [3.6, 1.0, 1.4], volume: 3.6, segments: 20, opacity: 0.88, billow: 0.28, drift: 0.44, seed: 6, color: CLOUD_BODY },
  { x: 13, y: 6.3, z: -12, bounds: [4.4, 1.1, 1.6], volume: 4, segments: 22, opacity: 0.86, billow: 0.22, drift: 0.3, seed: 7, color: CLOUD_BODY },
  // low, wide haze that melts the horizon into the sky (no hard line)
  { x: -6, y: 4.6, z: -19, bounds: [13, 0.9, 2], volume: 7, segments: 30, opacity: 0.6, billow: 0.1, drift: 0.16, seed: 8, color: CLOUD_HAZE },
  { x: 11, y: 4.8, z: -21, bounds: [14, 1.0, 2], volume: 8, segments: 32, opacity: 0.56, billow: 0.09, drift: 0.13, seed: 9, color: CLOUD_HAZE },
  // bright white chunks layered in front for sunlit highlights
  { x: -10, y: 7.9, z: -13, bounds: [3.2, 1.1, 1.4], volume: 3.5, segments: 24, opacity: 0.95, billow: 0.22, drift: 0.32, seed: 10, color: CLOUD_LIGHT },
  { x: 2, y: 8.0, z: -14, bounds: [4, 1.3, 1.6], volume: 4.5, segments: 28, opacity: 0.95, billow: 0.16, drift: 0.26, seed: 11, color: CLOUD_LIGHT },
  { x: 14, y: 7.3, z: -12, bounds: [3, 1.0, 1.3], volume: 3, segments: 20, opacity: 0.94, billow: 0.26, drift: 0.36, seed: 12, color: CLOUD_LIGHT },
  { x: -3, y: 9.4, z: -16, bounds: [3.6, 1.2, 1.5], volume: 4, segments: 24, opacity: 0.94, billow: 0.14, drift: 0.2, seed: 13, color: CLOUD_LIGHT },
]

function DriftingCloud({ def, animate }: { def: CloudDef; animate: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!animate || !ref.current) return
    const t = state.clock.elapsedTime
    const span = 56
    let x = def.x + t * def.drift
    x = (((x + 28) % span) + span) % span - 28 // wrap softly across the sky
    ref.current.position.x = x
    ref.current.position.y = def.y + Math.sin(t * 0.15 + def.seed) * 0.22
  })
  return (
    <group ref={ref} position={[def.x, def.y, def.z]}>
      <Cloud
        seed={def.seed}
        segments={def.segments}
        bounds={def.bounds}
        volume={def.volume}
        smallestVolume={0.25}
        concentrate="random"
        color={def.color}
        opacity={def.opacity}
        speed={def.billow}
        growth={3}
        fade={120}
      />
    </group>
  )
}

function SkyClouds({ animate }: { animate: boolean }) {
  return (
    <Clouds material={THREE.MeshBasicMaterial} limit={500}>
      {CLOUDS.map((def, i) => (
        <DriftingCloud key={i} def={def} animate={animate} />
      ))}
    </Clouds>
  )
}

type BirdDef = { x: number; y: number; z: number; scale: number; speed: number; phase: number }
const BIRDS: BirdDef[] = [
  { x: -10, y: 7.4, z: -11, scale: 1.5, speed: 1.9, phase: 0 },
  { x: -5, y: 8.0, z: -12, scale: 1.2, speed: 2.1, phase: 0.7 },
  { x: -14, y: 6.8, z: -10, scale: 1.4, speed: 1.7, phase: 1.4 },
  { x: 3, y: 8.4, z: -12, scale: 1.1, speed: 2.3, phase: 2.1 },
]

function Birds({ animate }: { animate: boolean }) {
  const tex = useMemo(() => makeBirdTexture(), [])
  const refs = useRef<THREE.Sprite[]>([])

  useFrame((state) => {
    if (!animate) return
    const t = state.clock.elapsedTime
    refs.current.forEach((s, i) => {
      if (!s) return
      const def = BIRDS[i]
      const span = 40
      let x = def.x + t * def.speed
      x = (((x + 20) % span) + span) % span - 20
      s.position.x = x
      s.position.y = def.y + Math.sin(t * 1.3 + def.phase) * 0.4
      // gentle "flap" by squashing the wings vertically
      const flap = 0.55 + Math.abs(Math.sin(t * 6 + def.phase)) * 0.45
      s.scale.set(def.scale, def.scale * flap, 1)
    })
  })

  return (
    <>
      {BIRDS.map((def, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el
          }}
          position={[def.x, def.y, def.z]}
          scale={[def.scale, def.scale * 0.7, 1]}
        >
          <spriteMaterial map={tex} transparent depthWrite={false} />
        </sprite>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Ground + lighting + camera framing
 * ------------------------------------------------------------------ */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#6f7d44" roughness={1} />
    </mesh>
  )
}

function ResponsiveCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  useLayoutEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const mobile = aspect < 0.85
    // pull back + widen on narrow screens so the whole field + parked tractor fit
    camera.position.set(0, mobile ? 4.2 : 3.2, mobile ? 17 : 12)
    camera.fov = mobile ? 56 : 42
    camera.updateProjectionMatrix()
    // look a little higher so the horizon sits lower on screen (more sky for the headline)
    camera.lookAt(0, mobile ? 2.7 : 2.5, -2)
  }, [camera, size])
  return null
}

/* ------------------------------------------------------------------ */
export default function HeroScene({ reduce = false }: { reduce?: boolean }) {
  const animate = !reduce
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 3.2, 12], fov: 42 }}
      frameloop={animate ? 'always' : 'demand'}
      // pan-y lets the page still scroll on vertical swipes, while horizontal
      // drags are delivered to the model for the 360° spin (otherwise touch
      // devices treat the drag as a scroll and the tractor never rotates).
      style={{ touchAction: 'pan-y' }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0)
      }}
    >
      <ResponsiveCamera />
      <fog attach="fog" args={['#dce9f2', 22, 54]} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#cfe3f0', '#4f7a2f', 0.6]} />
      <directionalLight position={[-7, 11, 6]} intensity={1.15} color="#fff3d6" />

      <Suspense fallback={null}>
        <Tractor animate={animate} />
        <RiceField animate={animate} />
        <Ground />
        <SkyClouds animate={animate} />
        <Birds animate={animate} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
