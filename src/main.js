import * as THREE from 'three'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'

/* ------------------ BASIC SETUP ------------------ */

const canvas = document.getElementById('canvas')

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.set(0, 1.2, 5)

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
})

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2

/* ------------------ HDRI ENVIRONMENT ------------------ */

const rgbeLoader = new RGBELoader()

rgbeLoader.load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/the_sky_is_on_fire_1k.hdr',
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = texture
    // scene.background = texture // ❌ remove if you want transparent bg
  }
)

/* ------------------ MODEL LOADING (DRACO) ------------------ */

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
)

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let model = null

gltfLoader.load(
  '/alien_soldier.glb',
  (gltf) => {
    model = gltf.scene
    model.scale.set(2, 2, 1)
    model.position.set(0, -0.5, 2.5)

    model.traverse((child) => {
      if (child.isMesh) {
        child.material.envMapIntensity = 1.3
        child.castShadow = false
        child.receiveShadow = false
      }
    })

    scene.add(model)
  },
  undefined,
  (err) => console.error(err)
)

/* ------------------ MOUSE PARALLAX (GSAP) ------------------ */

const mouse = { x: 0, y: 0 }

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.8
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.8
  document.getElementById('x').textContent = mouse.x.toFixed(2)
  document.getElementById('y').textContent = mouse.y.toFixed(2)
})

function parallax() {
  if (!model) return

  gsap.to(model.rotation, {
    y: mouse.x * 0.4,
    x: mouse.y * 0.25,
    duration: 0.6,
    ease: 'power3.out',
  })

  gsap.to(camera.position, {
    x: mouse.x * 0.4,
    y: 1.2 + mouse.y * 0.3,
    duration: 0.8,
    ease: 'power3.out',
  })
}

/* ------------------ RESIZE ------------------ */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/* ------------------ ANIMATION LOOP ------------------ */

function animate() {
  requestAnimationFrame(animate)

  parallax()

  renderer.render(scene, camera)
}

animate()
