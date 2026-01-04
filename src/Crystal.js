import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

/* ===================== BASIC ===================== */
const canvas = document.getElementById('crystal')

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  45,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  100
)
camera.position.set(0, 2, 8)

/* ===================== RENDERER ===================== */
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
})

renderer.setSize(canvas.clientWidth, canvas.clientHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

/* ===================== LIGHT ===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.6))

const spot = new THREE.SpotLight(0xffffff, 4)
spot.position.set(5, 10, 5)
scene.add(spot)

/* ===================== RAYCAST + MOUSE ===================== */
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2(10, 10)
const prevMouse = new THREE.Vector2()
let mouseVelocity = 0

/* ===================== MODEL ===================== */
let crystal
const parts = []

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
)

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)

loader.load('/crystal.glb', (gltf) => {
  crystal = gltf.scene
  crystal.scale.set(1,1,1)
  crystal.position.set(0, -1, 0)
  scene.add(crystal)

  crystal.traverse((child) => {
    if (child.isMesh) {
      child.userData.originalPos = child.position.clone()
      child.userData.direction = child.position.clone().normalize()
      parts.push(child)
    }
  })
})

/* ===================== MOUSE MOVE ===================== */
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()

  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

  mouseVelocity = mouse.distanceTo(prevMouse) * 40
  prevMouse.copy(mouse)
})

canvas.addEventListener('mouseleave', () => {
  mouse.set(10, 10)
})

/* ===================== RESIZE ===================== */
window.addEventListener('resize', () => {
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
})

/* ===================== ANIMATION ===================== */
function animate() {
  requestAnimationFrame(animate)

  if (crystal) {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(parts)

    let hitPoint = intersects.length ? intersects[0].point : null

    parts.forEach((part) => {
      let target = part.userData.originalPos.clone()

      if (hitPoint) {
        const worldPos = part.getWorldPosition(new THREE.Vector3())
        const dist = worldPos.distanceTo(hitPoint)

        if (dist < 1.5) {
          const strength = (1.5 - dist) * mouseVelocity * 0.015
          const offset = part.userData.direction
            .clone()
            .multiplyScalar(strength)

          target.add(offset)
        }
      }

      part.position.lerp(target, 0.12)
    })

    mouseVelocity *= 0.9
    crystal.rotation.y += 0.002
  }

  renderer.render(scene, camera)
}

animate()
