import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ===================== BASIC SETUP ===================== */
const canvas = document.getElementById('crystal')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
camera.position.set(0, 2, 8)

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
})
renderer.setSize(canvas.clientWidth, canvas.clientHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

/* ===================== LIGHTING ===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.6))
const spot = new THREE.SpotLight(0xffffff, 4)
spot.position.set(5, 10, 5)
scene.add(spot)

/* ===================== INTERACTION STATE ===================== */
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2(10, 10)
const prevMouse = new THREE.Vector2()
let mouseVelocity = 0
const tempVec = new THREE.Vector3()
const parts = []
let crystal = null

/* ===================== MODEL LOADING ===================== */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)

loader.load('/crystal.glb', (gltf) => {
  crystal = gltf.scene
  crystal.position.set(-4, 7, -24)
  scene.add(crystal)

  crystal.traverse((child) => {
    if (child.isMesh) {
      // Store initial state in local space
      child.userData.originalPos = child.position.clone()
      // Create a normalized direction vector for the explosion effect
      child.userData.direction = child.position.clone().normalize()
      parts.push(child)
    }
  })

  // Initialize Scroll Animation AFTER model is loaded
  initScrollAnimations()
})

/* ===================== GSAP SCROLL ===================== */
function initScrollAnimations() {
  if (!crystal) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".page2",
      start: "top top", // Starts when page2 enters the viewport
      scrub: 1,           // Smoothly links animation to scroll
      markers: false,
      end: "bottom top"
    }
  })

  tl.to(crystal.position, {
    y:-0.5, 
    x:6,
    
    duration:0.5,
    ease: "linear"
  })
  tl.to(crystal.position, {
    y:-8, 
    x:0,
    
    duration:0.5,
    ease: "linear"
  })
  

  
  tl.to(crystal.rotation, {
    x: Math.PI * 0.2,
    duration: 0.5
  },)
}

/* ===================== EVENTS ===================== */
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  
  mouseVelocity = mouse.distanceTo(prevMouse) * 50
  prevMouse.copy(mouse)
})

canvas.addEventListener('mouseleave', () => {
  mouse.set(10, 10)
})

window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
})

/* ===================== ANIMATION LOOP ===================== */
function animate() {
  requestAnimationFrame(animate)

  if (crystal) {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(parts)
    const hitPoint = intersects.length ? intersects[0].point : null

    parts.forEach((part) => {
      // Start with original local position
      let target = part.userData.originalPos.clone()

      if (hitPoint) {
        // Get world position of the part to check distance to mouse hit
        part.getWorldPosition(tempVec)
        const dist = tempVec.distanceTo(hitPoint)

        if (dist < 1.8) {
          const strength = (1.8 - dist) * (mouseVelocity + 0.1) * 0.4
          const offset = part.userData.direction.clone().multiplyScalar(strength)
          target.add(offset)
        }
      }
      // Smooth lerp back to original or to exploded position
      part.position.lerp(target, 0.1)
    })

    mouseVelocity *= 0.92 // Velocity decay
    crystal.rotation.y += 0.003 // Subtle constant rotation
  }

  renderer.render(scene, camera)
}

animate()