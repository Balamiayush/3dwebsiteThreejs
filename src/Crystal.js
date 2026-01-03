import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

/* CANVAS */
const canvas = document.getElementById('crystal')

/* SCENE */
const scene = new THREE.Scene()

/* CAMERA */
const camera = new THREE.PerspectiveCamera(
  50,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  50
)
camera.position.set(0, 2.5, 10)
scene.add(camera)

/* RENDERER */
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
})

renderer.setSize(canvas.clientWidth, canvas.clientHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.physicallyCorrectLights = true

/* LIGHT */
const light = new THREE.DirectionalLight(0xffffff, 2)
light.position.set(5, 5, 5)
scene.add(light)

/* DRACO LOADER */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
)

/* GLTF LOADER (WITH DRACO) */
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/* MODEL */
let crystal = null

gltfLoader.load(
  '/crystal.glb',
  (gltf) => {
    crystal = gltf.scene
    crystal.scale.set(1.2, 1.2, 1.2)
    crystal.position.set(0, -1, 0)
    scene.add(crystal)
  },
  undefined,
  (error) => {
    console.error('GLTF load error:', error)
  }
)

/* RESIZE */
window.addEventListener('resize', () => {
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/* ANIMATE */
function animate() {
  requestAnimationFrame(animate)

  if (crystal) {
    crystal.rotation.y += 0.003
  }

  renderer.render(scene, camera)
}

animate()
