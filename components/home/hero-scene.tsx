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

// The super-seeder's length already runs along its local X axis, which is its
// direction of travel (+X) — so it drives across broadside with no extra turn.
// (The previous tractor model's length ran along Z and needed a PI/2 yaw here.)
const MODEL_YAW = 0

const MODEL_URL = '/superseedmodel.glb'

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/* ------------------------------------------------------------------ *
 * Wheat field — instanced crossed quads textured with a wheat stalk,
 * swaying on the same wind + growth shader the grass used.
 * ------------------------------------------------------------------ */
const WHEAT_COUNT = 2600

// One realistic wheat stalk drawn onto a transparent canvas: straw stem,
// a two-row grain ear of overlapping kernels, and fine awns fanning up.
function makeWheatTexture() {
  const c = document.createElement('canvas')
  c.width = 96
  c.height = 256
  const ctx = c.getContext('2d')!
  const cx = c.width / 2

  // helper coords: y=0 top (ear), y=height bottom (root)
  // Stem — straw gold, tapering slightly toward the ear
  const stemGrad = ctx.createLinearGradient(0, 110, 0, 256)
  stemGrad.addColorStop(0, '#c8a23a')
  stemGrad.addColorStop(1, '#b8902f')
  ctx.strokeStyle = stemGrad
  ctx.lineCap = 'round'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(cx, 118)
  ctx.lineTo(cx, 252)
  ctx.stroke()

  // Awns — fine pale-gold bristles fanning up out of the ear top
  ctx.strokeStyle = 'rgba(230,210,130,0.55)'
  ctx.lineWidth = 2
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath()
    ctx.moveTo(cx, 96)
    ctx.lineTo(cx + i * 7, 18 + Math.abs(i) * 6)
    ctx.stroke()
  }

  // Grain ear — two staggered rows of overlapping kernels (highlight/mid/shadow)
  const kernel = (x: number, y: number, rot: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    const g = ctx.createLinearGradient(-8, 0, 8, 0)
    g.addColorStop(0, '#9c7322')
    g.addColorStop(0.5, '#c8a23a')
    g.addColorStop(1, '#e6c662')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(0, 0, 7, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  for (let r = 0; r < 8; r++) {
    const y = 100 - r * 11
    kernel(cx - 7, y, -0.32)
    kernel(cx + 7, y - 5, 0.32)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Two crossed quads (one rotated 90° about Y) merged into a single geometry so
// each instance stays visible from any camera angle. Root pivot at y=0, top at y=H.
function makeWheatGeometry() {
  const W = 0.22
  const H = 1.3
  const hw = W / 2
  // positions / uvs / normals for two quads (4 verts each), indexed
  const pos: number[] = []
  const uv: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  const addQuad = (axis: 'x' | 'z', n: [number, number, number]) => {
    const base = pos.length / 3
    // bottom-left, bottom-right, top-right, top-left
    const corners: [number, number][] = [
      [-hw, 0],
      [hw, 0],
      [hw, H],
      [-hw, H],
    ]
    const uvs: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]
    for (let i = 0; i < 4; i++) {
      const [a, y] = corners[i]
      if (axis === 'x') pos.push(a, y, 0)
      else pos.push(0, y, a)
      uv.push(uvs[i][0], uvs[i][1])
      nor.push(n[0], n[1], n[2])
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  addQuad('x', [0, 0, 1])
  addQuad('z', [1, 0, 0])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setIndex(idx)
  return g
}

const wheatVertex = /* glsl */ `
  uniform float uTime;
  uniform float uGrow;
  uniform float uWind;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 ipos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

    // per-stalk random so the field grows in a soft, staggered wave
    float rnd = fract(sin(dot(ipos.xz, vec2(12.9898, 78.233))) * 43758.5453);
    float g = clamp((uGrow - rnd * 0.35) / 0.65, 0.0, 1.0);
    g = smoothstep(0.0, 1.0, g);

    float h = uv.y;             // 0 at root, 1 at the ear
    vec3 pos = position;
    pos.y *= g;                 // grow up out of the ground

    // heavier, slower sway than grass — the loaded ear drags the tip
    float bend = h * h * uWind * g;
    float w = sin(uTime * 1.1 + ipos.x * 0.5 + ipos.z * 0.6)
            + 0.5 * sin(uTime * 1.9 + ipos.z * 0.9);
    pos.x += w * bend;
    pos.z += 0.4 * cos(uTime * 0.9 + ipos.x * 0.7) * bend;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`

const wheatFragment = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;

  void main() {
    vec4 t = texture2D(uMap, vUv);
    if (t.a < 0.4) discard;     // alpha-cut the stalk silhouette (no blending/sort)
    gl_FragColor = vec4(t.rgb, 1.0);
  }
`

function WheatField({ animate }: { animate: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => makeWheatGeometry(), [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: wheatVertex,
        fragmentShader: wheatFragment,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uGrow: { value: animate ? 0 : 1 },
          uWind: { value: 0.13 },
          uMap: { value: makeWheatTexture() },
        },
      }),
    [animate],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < WHEAT_COUNT; i++) {
      const x = THREE.MathUtils.randFloatSpread(27)
      const z = -13 + Math.random() * 16
      const h = 0.9 + Math.random() * 0.7
      const w = 0.7 + Math.random() * 0.5
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

  return <instancedMesh ref={meshRef} args={[geometry, material, WHEAT_COUNT]} />
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
    // footLength is the extent along the travel axis (world X), footWidth the
    // depth toward the camera (world Z). With MODEL_YAW = 0 the model's local X
    // is the travel axis and local Z is the depth.
    return {
      object: obj,
      scale: s,
      footWidth: size.z * s,
      footLength: size.x * s,
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

// A filled gull silhouette drawn at a given wing position. `lift` in [-1,1]
// raises (-) or lowers (+) the wingtips; cycling a few of these reads as a flap.
function drawBird(ctx: CanvasRenderingContext2D, lift: number) {
  const w = 128
  const cx = w / 2
  const cy = w * 0.46
  const span = 52 // half wingspan
  const tipY = cy - lift * 30 // wingtip height relative to the body
  const elbowY = cy - lift * 14
  ctx.fillStyle = '#2a2f2b'
  ctx.beginPath()
  // start at left tip, sweep through the body, out to the right tip and back,
  // giving each wing a swept-back trailing edge (gull shape)
  ctx.moveTo(cx - span, tipY)
  ctx.quadraticCurveTo(cx - span * 0.5, elbowY - 4, cx - 6, cy + 2) // left leading edge
  ctx.quadraticCurveTo(cx, cy + 7, cx + 6, cy + 2) // body underside
  ctx.quadraticCurveTo(cx + span * 0.5, elbowY - 4, cx + span, tipY) // right leading edge
  ctx.quadraticCurveTo(cx + span * 0.5, elbowY + 8, cx + 4, cy + 9) // right trailing edge
  ctx.quadraticCurveTo(cx, cy + 12, cx - 4, cy + 9) // tail notch
  ctx.quadraticCurveTo(cx - span * 0.5, elbowY + 8, cx - span, tipY) // left trailing edge
  ctx.closePath()
  ctx.fill()
}

// Wing-position keyframes for the flap cycle (down → level → up → level).
function makeBirdFrames(): THREE.CanvasTexture[] {
  const lifts = [-0.9, -0.2, 0.85, -0.2]
  return lifts.map((lift) => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    drawBird(c.getContext('2d')!, lift)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  })
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

type BirdDef = {
  x: number
  y: number
  z: number
  scale: number
  speed: number
  phase: number
  flap: number // wingbeats per second
}
// Two loose V-formations gliding across the sky at different depths/heights.
const BIRDS: BirdDef[] = [
  // lead V (higher)
  { x: -10, y: 8.4, z: -12, scale: 1.5, speed: 1.9, phase: 0.0, flap: 2.6 },
  { x: -12.4, y: 8.0, z: -12, scale: 1.2, speed: 1.9, phase: 0.5, flap: 2.6 },
  { x: -7.6, y: 8.0, z: -12, scale: 1.2, speed: 1.9, phase: 0.9, flap: 2.6 },
  // trailing pair (lower, nearer, slightly faster)
  { x: 4, y: 7.0, z: -10, scale: 1.6, speed: 2.3, phase: 1.6, flap: 3.0 },
  { x: 1.6, y: 6.7, z: -10, scale: 1.3, speed: 2.3, phase: 2.1, flap: 3.0 },
  // a lone high one drifting slower
  { x: -3, y: 9.3, z: -14, scale: 1.0, speed: 1.5, phase: 3.0, flap: 2.2 },
]

function Birds({ animate }: { animate: boolean }) {
  const frames = useMemo(() => makeBirdFrames(), [])
  const refs = useRef<THREE.Sprite[]>([])
  const mats = useRef<THREE.SpriteMaterial[]>([])

  useFrame((state) => {
    if (!animate) return
    const t = state.clock.elapsedTime
    refs.current.forEach((s, i) => {
      if (!s) return
      const def = BIRDS[i]
      const span = 44
      let x = def.x + t * def.speed
      x = (((x + 22) % span) + span) % span - 22
      s.position.x = x
      s.position.y = def.y + Math.sin(t * 1.1 + def.phase) * 0.45 // gentle glide
      const mat = mats.current[i]
      if (mat) {
        // cycle the wing-position frames to flap
        mat.map = frames[Math.floor(t * def.flap + def.phase * 2) % frames.length]
        mat.rotation = Math.sin(t * 0.9 + def.phase) * 0.12 // subtle banking
        mat.needsUpdate = true
      }
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
          scale={[def.scale, def.scale, 1]}
        >
          <spriteMaterial
            ref={(m) => {
              if (m) mats.current[i] = m
            }}
            map={frames[1]}
            transparent
            depthWrite={false}
          />
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
      <meshStandardMaterial color="#9c8f4e" roughness={1} />
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
        <WheatField animate={animate} />
        <Ground />
        <SkyClouds animate={animate} />
        <Birds animate={animate} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
