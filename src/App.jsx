import { useState, useEffect, useRef } from "react"
import { createClient } from '@supabase/supabase-js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase connection failed: missing env variables")
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ADMIN_EMAIL = "alitronicdeveloper@gmail.com"
const ADMIN_PASSWORD = "***a12l05l2004y###"

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return isMobile
}

// ============ 3D MAP COMPONENT WITH REALISTIC SHOPS ============
const Kariakoo3DMap = ({ shops, onShopSelect, selectedShop }) => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const markersRef = useRef([])
  const [isReady, setIsReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Function to create a realistic shop building with frames
  const createRealisticShop = (x, z, name, color, shopType = 'electronics') => {
    const group = new THREE.Group()
    
    // ============ MAIN BUILDING ============
    const width = 4.5
    const depth = 4.5
    const height = 3.5
    
    // Main walls (with texture-like colors)
    const wallMaterial = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.1 })
    const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial)
    mainBuilding.position.y = height / 2
    mainBuilding.castShadow = true
    mainBuilding.receiveShadow = true
    group.add(mainBuilding)
    
    // ============ ROOF ============
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.05 })
    
    // Main roof (flat with edges)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.2, depth + 0.6), roofMaterial)
    roof.position.y = height + 0.1
    roof.castShadow = true
    group.add(roof)
    
    // Roof top decoration (corner pieces)
    const cornerMaterial = new THREE.MeshStandardMaterial({ color: 0xD2691E })
    const corners = [
      { x: (width/2) + 0.2, z: (depth/2) + 0.2 },
      { x: (width/2) + 0.2, z: -(depth/2) - 0.2 },
      { x: -(width/2) - 0.2, z: (depth/2) + 0.2 },
      { x: -(width/2) - 0.2, z: -(depth/2) - 0.2 }
    ]
    corners.forEach(pos => {
      const cornerPiece = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), cornerMaterial)
      cornerPiece.position.set(pos.x, height + 0.25, pos.z)
      cornerPiece.castShadow = true
      group.add(cornerPiece)
    })
    
    // ============ FRONT WINDOW (Large display window) ============
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x87CEEB, metalness: 0.9, roughness: 0.1, emissive: 0x112233 })
    const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.7 })
    
    // Main display window (front)
    const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.1), windowMaterial)
    frontWindow.position.set(0, 1.5, depth/2 + 0.05)
    frontWindow.castShadow = true
    group.add(frontWindow)
    
    // Window frame (horizontal bars)
    const frameH1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.12), windowFrameMaterial)
    frameH1.position.set(0, 2.5, depth/2 + 0.08)
    group.add(frameH1)
    
    const frameH2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.12), windowFrameMaterial)
    frameH2.position.set(0, 0.8, depth/2 + 0.08)
    group.add(frameH2)
    
    // Window frame (vertical bars)
    const frameV1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.12), windowFrameMaterial)
    frameV1.position.set(-1.5, 1.7, depth/2 + 0.08)
    group.add(frameV1)
    
    const frameV2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.12), windowFrameMaterial)
    frameV2.position.set(1.5, 1.7, depth/2 + 0.08)
    group.add(frameV2)
    
    // ============ DOOR ============
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.3 })
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), doorMaterial)
    door.position.set(0, 1.1, depth/2 + 0.08)
    door.castShadow = true
    group.add(door)
    
    // Door handle
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9 })
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), handleMaterial)
    handle.position.set(0.4, 1.2, depth/2 + 0.12)
    group.add(handle)
    
    // ============ SIDE WINDOWS ============
    // Left window
    const leftWindow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), windowMaterial)
    leftWindow.position.set(-width/2 - 0.05, 1.8, 0)
    leftWindow.rotation.y = Math.PI / 2
    leftWindow.castShadow = true
    group.add(leftWindow)
    
    // Right window
    const rightWindow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), windowMaterial)
    rightWindow.position.set(width/2 + 0.05, 1.8, 0)
    rightWindow.rotation.y = Math.PI / 2
    rightWindow.castShadow = true
    group.add(rightWindow)
    
    // ============ SHOP SIGN (Name board) ============
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0xFF4444 })
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 0.1), signBoardMat)
    signBoard.position.set(0, 3.2, depth/2 + 0.1)
    group.add(signBoard)
    
    // Sign border (gold)
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 })
    const border = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.12), borderMat)
    border.position.set(0, 3.4, depth/2 + 0.12)
    group.add(border)
    
    // ============ INTERIOR DETAILS (Shelves and Products) ============
    // Back wall shelf
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0xCD853F, roughness: 0.5 })
    
    // Left shelf unit
    for (let i = 0; i < 3; i++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.8), shelfMat)
      shelf.position.set(-1.5, 0.8 + (i * 0.8), -1.2)
      shelf.castShadow = true
      group.add(shelf)
      
      // Products on shelf (small colored boxes)
      for (let j = 0; j < 3; j++) {
        const product = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.25, 0.25),
          new THREE.MeshStandardMaterial({ color: 0xFF6600 })
        )
        product.position.set(-1.5 + (j * 0.5), 0.95 + (i * 0.8), -0.8)
        product.castShadow = true
        group.add(product)
      }
    }
    
    // Right shelf unit
    for (let i = 0; i < 3; i++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.8), shelfMat)
      shelf.position.set(1.5, 0.8 + (i * 0.8), -1.2)
      shelf.castShadow = true
      group.add(shelf)
      
      // Products on right shelf
      for (let j = 0; j < 3; j++) {
        const product = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.25, 0.25),
          new THREE.MeshStandardMaterial({ color: 0x44AAFF })
        )
        product.position.set(1.5 + (j * 0.5), 0.95 + (i * 0.8), -0.8)
        product.castShadow = true
        group.add(product)
      }
    }
    
    // Counter/Checkout desk (front area)
    const counterMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 })
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), counterMat)
    counter.position.set(0, 0.4, 1.2)
    counter.castShadow = true
    group.add(counter)
    
    // Counter top
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 1.1), new THREE.MeshStandardMaterial({ color: 0x8B4513 }))
    counterTop.position.set(0, 0.85, 1.2)
    counterTop.castShadow = true
    group.add(counterTop)
    
    // Cash register on counter
    const cashReg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }))
    cashReg.position.set(0.4, 1.0, 1.2)
    cashReg.castShadow = true
    group.add(cashReg)
    
    // ============ CEILING LIGHT ============
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xFFFFAA, emissive: 0xFFAA44, emissiveIntensity: 0.5 })
    const ceilingLight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), lightMat)
    ceilingLight.position.set(0, height - 0.2, 0)
    group.add(ceilingLight)
    
    // Add small point light inside
    const interiorLight = new THREE.PointLight(0xFFAA66, 0.5, 8)
    interiorLight.position.set(0, 2, 0)
    group.add(interiorLight)
    
    // ============ EXTERIOR LIGHT (Wall lamp) ============
    const wallLampMat = new THREE.MeshStandardMaterial({ color: 0xFFDD88, emissive: 0xFF8822, emissiveIntensity: 0.3 })
    const wallLamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), wallLampMat)
    wallLamp.position.set(1.5, 2.2, depth/2 + 0.15)
    group.add(wallLamp)
    
    const wallLamp2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), wallLampMat)
    wallLamp2.position.set(-1.5, 2.2, depth/2 + 0.15)
    group.add(wallLamp2)
    
    // ============ AWNING (Kibanda cha mbele) ============
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xCC3333 })
    const awning = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 1.2), awningMat)
    awning.position.set(0, 3, depth/2 + 0.4)
    awning.castShadow = true
    group.add(awning)
    
    // Awning stripes
    for (let i = -2; i <= 2; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.1), new THREE.MeshStandardMaterial({ color: 0xFFD700 }))
      stripe.position.set(i * 0.8, 3.08, depth/2 + 0.45)
      group.add(stripe)
    }
    
    group.position.set(x, 0, z)
    group.userData = { name, isShop: true, type: shopType }
    
    return group
  }
  
  // Function to create Kariakoo Market (bigger, more detailed)
  const createKariakooMarket = (x, z) => {
    const group = new THREE.Group()
    const width = 14
    const depth = 14
    const height = 5
    
    // Main building
    const marketMat = new THREE.MeshStandardMaterial({ color: 0xCC8866, roughness: 0.5 })
    const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), marketMat)
    mainBuilding.position.y = height / 2
    mainBuilding.castShadow = true
    group.add(mainBuilding)
    
    // Roof (dome-like)
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xAA6644 })
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(8, 8.5, 1.2, 8), roofMat)
    roof.position.y = height + 0.6
    roof.castShadow = true
    group.add(roof)
    
    // Center dome
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xDD8844 })
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), domeMat)
    dome.position.y = height + 1.2
    dome.castShadow = true
    group.add(dome)
    
    // Large entrance
    const entranceMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B })
    const entranceFrame = new THREE.Mesh(new THREE.BoxGeometry(4, 3.5, 0.5), entranceMat)
    entranceFrame.position.set(0, 1.8, depth/2 + 0.25)
    group.add(entranceFrame)
    
    // Multiple windows around
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, metalness: 0.7 })
    for (let i = -5; i <= 5; i+=2.5) {
      if (Math.abs(i) < 2) continue
      const windowBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.2), windowMat)
      windowBox.position.set(i, 2.5, depth/2 + 0.15)
      group.add(windowBox)
    }
    
    group.position.set(x, 0, z)
    group.userData = { name: "Kariakoo Market", isShop: true, isMarket: true }
    return group
  }

  useEffect(() => {
    if (!containerRef.current) return

    try {
      // Scene setup
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0a2a)
      scene.fog = new THREE.FogExp2(0x0a0a2a, 0.002)
      sceneRef.current = scene

      // Camera
      const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 500)
      camera.position.set(30, 25, 30)
      camera.lookAt(0, 0, 0)
      cameraRef.current = camera

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.zoomSpeed = 1.2
      controls.panSpeed = 0.8
      controls.rotateSpeed = 1.0
      controls.maxPolarAngle = Math.PI / 2.2
      controlsRef.current = controls

      // Ground
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8 })
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), groundMat)
      ground.rotation.x = -Math.PI / 2
      ground.position.y = -0.5
      ground.receiveShadow = true
      scene.add(ground)

      // Grid
      const gridHelper = new THREE.GridHelper(160, 25, 0x4a6741, 0x2d4a2a)
      gridHelper.position.y = -0.4
      scene.add(gridHelper)

      // Roads
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.4 })
      const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 140), roadMat)
      mainRoad.position.set(0, -0.3, 0)
      mainRoad.receiveShadow = true
      scene.add(mainRoad)
      
      const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(140, 0.2, 8), roadMat)
      crossRoad.position.set(0, -0.3, 0)
      crossRoad.receiveShadow = true
      scene.add(crossRoad)

      // ============ CREATE REALISTIC SHOPS WITH FRAMES ============
      
      // Kariakoo Market (center)
      const market = createKariakooMarket(0, 0)
      scene.add(market)
      
      // Surrounding shops with different types
      const shopsData = [
        { x: -10, z: -8, name: "Electronics Zone", color: 0x4682B4, type: "electronics" },
        { x: 10, z: -8, name: "Phone City", color: 0x5F9EA0, type: "phones" },
        { x: -8, z: 10, name: "Clothing Hub", color: 0xCD853F, type: "clothing" },
        { x: 8, z: 10, name: "Fashion World", color: 0xD2691E, type: "fashion" },
        { x: -12, z: 0, name: "Footwear Bazaar", color: 0xBC8F8F, type: "shoes" },
        { x: 12, z: 0, name: "Accessories", color: 0xA0522D, type: "accessories" },
        { x: 0, z: -12, name: "Phone Repair", color: 0xDEB887, type: "repair" },
        { x: 0, z: 12, name: "SIM Cards", color: 0x8B4513, type: "services" },
        { x: -15, z: -12, name: "Tech Store", color: 0x4682B4, type: "electronics" },
        { x: 15, z: -12, name: "Gadgets", color: 0x5F9EA0, type: "electronics" },
        { x: -12, z: 15, name: "Camera World", color: 0xD2691E, type: "electronics" },
        { x: 12, z: 15, name: "Watch Store", color: 0xBC8F8F, type: "accessories" },
        { x: -5, z: -15, name: "Food Court", color: 0x228B22, type: "food" },
        { x: 5, z: -15, name: "Coffee Shop", color: 0xFF6347, type: "food" },
        { x: -15, z: 5, name: "Bank", color: 0x20B2AA, type: "service" },
        { x: 15, z: 5, name: "Pharmacy", color: 0x9370DB, type: "service" },
      ]
      
      shopsData.forEach(shop => {
        const shopGroup = createRealisticShop(shop.x, shop.z, shop.name, shop.color, shop.type)
        scene.add(shopGroup)
      })

      // Street lights
      const lampPositions = [
        [-35, -35], [-35, -15], [-35, 0], [-35, 15], [-35, 35],
        [35, -35], [35, -15], [35, 0], [35, 15], [35, 35],
        [-15, -35], [0, -35], [15, -35], [-15, 35], [0, 35], [15, 35]
      ]
      
      lampPositions.forEach(pos => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3.5, 6), new THREE.MeshStandardMaterial({ color: 0x666666 }))
        pole.position.set(pos[0], 1.8, pos[1])
        pole.castShadow = true
        scene.add(pole)
        
        const lampMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0xff4422, emissiveIntensity: 0.4 })
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), lampMat)
        lamp.position.set(pos[0], 3.6, pos[1])
        scene.add(lamp)
      })

      // Trees
      const treePositions = [
        [-28, -28], [-22, -32], [-32, -22], [28, -28], [32, -22], [22, -32],
        [-28, 28], [-22, 32], [-32, 22], [28, 28], [32, 22], [22, 32]
      ]
      
      treePositions.forEach(pos => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x8B5A2B }))
        trunk.position.set(pos[0], 0.6, pos[1])
        trunk.castShadow = true
        scene.add(trunk)
        
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x2d5a27 }))
        foliage.position.set(pos[0], 1.3, pos[1])
        foliage.castShadow = true
        scene.add(foliage)
        
        const foliageTop = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x3d6a37 }))
        foliageTop.position.set(pos[0], 2.0, pos[1])
        foliageTop.castShadow = true
        scene.add(foliageTop)
      })

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
      scene.add(ambientLight)
      
      const sunLight = new THREE.DirectionalLight(0xfff5e6, 1)
      sunLight.position.set(20, 30, 15)
      sunLight.castShadow = true
      sunLight.shadow.mapSize.width = 1024
      sunLight.shadow.mapSize.height = 1024
      scene.add(sunLight)
      
      const fillLight = new THREE.PointLight(0x4466cc, 0.3)
      fillLight.position.set(0, 10, 0)
      scene.add(fillLight)

      setIsReady(true)
      
      // Animation
      const animate = () => {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()
      
      const handleResize = () => {
        if (!containerRef.current) return
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        if (containerRef.current && rendererRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
        renderer.dispose()
      }

    } catch (error) {
      console.error("Error initializing 3D Map:", error)
    }
  }, [])

  const searchAndZoom = (shopName) => {
    if (!shopName) return
    if (sceneRef.current && cameraRef.current && controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0)
      cameraRef.current.position.set(12, 15, 12)
      controlsRef.current.update()
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '550px', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 20, maxWidth: '350px' }}>
        <input
          type="text"
          placeholder="🔍 Search shop... (e.g., Electronics Zone)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchAndZoom(searchQuery)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(15,23,42,0.95)',
            color: 'white',
            fontSize: '14px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            outline: 'none'
          }}
        />
      </div>
      
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {!isReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '12px',
          zIndex: 20,
          textAlign: 'center'
        }}>
          <div>⏳ Building 3D Kariakoo with realistic shops...</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Creating windows, doors, shelves, and products</div>
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(0,0,0,0.7)',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '10px',
        color: '#94a3b8',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        🖱️ Drag to rotate | Right-click + drag to pan | Scroll to zoom | 🏪 Realistic shops with windows, doors, shelves & products
      </div>
    </div>
  )
}


// ============ MAIN APP ============
export default function App() {
  const [page, setPage] = useState("home")
  const [selectedShop, setSelectedShop] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [dbProducts, setDbProducts] = useState([])
  const [dbShops, setDbShops] = useState([])
  const [dbLeads, setDbLeads] = useState([])
  const isMobile = useIsMobile()
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingMultiple, setUploadingMultiple] = useState(false)

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("baizona_cart")
    return savedCart ? JSON.parse(savedCart) : []
  })

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem("baizona_auth")
    if (saved) {
      const auth = JSON.parse(saved)
      if (auth.isAdmin) return true
    }
    return false
  })

  const [loggedInShop, setLoggedInShop] = useState(null)
  const [isAdmin, setIsAdmin] = useState(() => {
    const saved = localStorage.getItem("baizona_auth")
    return saved ? JSON.parse(saved).isAdmin || false : false
  })

  const [loginError, setLoginError] = useState("")
  const [loginShopName, setLoginShopName] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginAdminPassword, setLoginAdminPassword] = useState("")
  const isAdminMode = window.location.hash === '#admin'

  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", images: [], shop: "", category: "" })
  const [adminNewProduct, setAdminNewProduct] = useState({ name: "", price: "", description: "", images: [], category: "" })

  const [shopStats, setShopStats] = useState({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
  const [adminStats, setAdminStats] = useState({ totalShops: 0, totalProducts: 0, totalViews: 0, totalWhatsappClicks: 0, totalCartAdditions: 0, totalLeads: 0 })

  const [editingShop, setEditingShop] = useState(null)
  const [newShopData, setNewShopData] = useState({
    name: "", logo: "", category: "", description: "", location: "", phone: "", email: "",
    working_hours: "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM", rating: "4.0", password: ""
  })
  const [adminTab, setAdminTab] = useState("overview")
  const [adminMessage, setAdminMessage] = useState("")

  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [profileForm, setProfileForm] = useState({ owner_name: "", phone: "", email: "", current_password: "", new_password: "", confirm_password: "" })
  const [profileMessage, setProfileMessage] = useState("")

  const [productCategories, setProductCategories] = useState(["All", "Electronics", "Fashion", "Beauty", "Home", "Sports", "Food", "Books", "Services", "Other"])
  const [newCategoryInput, setNewCategoryInput] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("baizona_auth")
    if (saved && !isLoggedIn && dbShops.length > 0) {
      const auth = JSON.parse(saved)
      if (!auth.isAdmin && auth.shopName && auth.password) {
        const shop = dbShops.find(s => s.name === auth.shopName && s.password === auth.password)
        if (shop) { setIsLoggedIn(true); setLoggedInShop(shop); calculateShopStats(shop.name).then(s => setShopStats(s)) }
      }
    }
  }, [dbShops])

  const fetchProducts = async () => { const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false }); if (!error) setDbProducts(data || []) }
  const fetchShops = async () => { const { data, error } = await supabase.from('shops').select('*').order('id', { ascending: true }); if (!error) setDbShops(data || []) }
  const fetchLeads = async () => { const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }); if (!error) setDbLeads(data || []) }

  useEffect(() => { fetchProducts(); fetchShops(); fetchLeads() }, [])
  useEffect(() => { localStorage.setItem("baizona_cart", JSON.stringify(cart)) }, [cart])

  const trackProductView = async (p) => { try { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'view' }]) } catch {} }
  const trackWhatsAppClick = async (sn) => { try { await supabase.from('analytics').insert([{ shop_name: sn, action_type: 'whatsapp_click' }]) } catch {} }
  const trackCartAddition = async (p) => { try { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'cart_add' }]) } catch {} }
  const trackLead = async (pn, sn, ca) => { try { await supabase.from('leads').insert([{ product_name: pn, shop_name: sn, customer_action: ca, status: 'New' }]); fetchLeads() } catch {} }

  const fetchAnalytics = async () => { try { const { data } = await supabase.from('analytics').select('*'); return data || [] } catch { return [] } }

  const calculateAdminStats = async () => {
    const a = await fetchAnalytics()
    return { totalShops: dbShops.length, totalProducts: dbProducts.length, totalViews: a.filter(x => x.action_type === 'view').length, totalWhatsappClicks: a.filter(x => x.action_type === 'whatsapp_click').length, totalCartAdditions: a.filter(x => x.action_type === 'cart_add').length, totalLeads: dbLeads.length }
  }

  useEffect(() => { if (isAdmin) { calculateAdminStats().then(s => setAdminStats(s)) } }, [isAdmin, dbShops, dbProducts, dbLeads])

  const calculateShopStats = async (sn) => {
    const a = await fetchAnalytics(); const sa = a.filter(x => x.shop_name === sn)
    return { totalViews: sa.filter(x => x.action_type === 'view').length, whatsappClicks: sa.filter(x => x.action_type === 'whatsapp_click').length, cartAdditions: sa.filter(x => x.action_type === 'cart_add').length, totalProducts: dbProducts.filter(p => p.shop === sn).length }
  }

  const getShopWhatsApp = (shopName) => { const shop = dbShops.find(s => s.name === shopName); return shop?.phone || "255700000000" }
  const getShopLocation = (shopName) => { const shop = dbShops.find(s => s.name === shopName); return shop?.location || "Kariakoo, Dar es Salaam" }

  const handleImageUpload = async (file, setter, type = 'product') => {
    if (!file) return null
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert("❌ Tafadhali chagua picha ya aina: JPEG, PNG, WEBP, au GIF")
      return null
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("❌ Picha ni kubwa sana. Maximum ni 2MB")
      return null
    }
    setUploadingImage(true)
    try {
      const bucketName = type === 'product' ? 'product-images' : 'shop-logos'
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExt = file.name.split('.').pop()
      const fileName = `${timestamp}-${randomString}.${fileExt}`
      const { error } = await supabase.storage.from(bucketName).upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName)
      if (setter && typeof setter === 'function') setter(publicUrl)
      return publicUrl
    } catch (err) {
      console.error("Upload error:", err)
      alert(`❌ Upload imefeli: ${err.message}`)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleMultipleImagesUpload = async (files, currentImages, setImages) => {
    if (!files || files.length === 0) return
    setUploadingMultiple(true)
    const uploadedUrls = []
    for (const file of files) {
      const url = await handleImageUpload(file, null, 'product')
      if (url) uploadedUrls.push(url)
    }
    if (uploadedUrls.length > 0) {
      setImages([...currentImages, ...uploadedUrls])
      alert(`✅ ${uploadedUrls.length} picha zimepakiwa successfully!`)
    }
    setUploadingMultiple(false)
  }

  const addNewCategory = () => {
    if (newCategoryInput && !productCategories.includes(newCategoryInput)) {
      setProductCategories([...productCategories, newCategoryInput])
      setNewCategoryInput("")
      alert(`✅ Category "${newCategoryInput}" imeongezwa!`)
    }
  }

  const filteredProducts = dbProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.shop.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredShops = selectedCategory === "All" ? dbShops : dbShops.filter(s => s.category === selectedCategory)

  const addToCart = () => {
    if (!selectedProduct) return
    const shop = selectedShop?.name || selectedProduct.shop || "Baizona"
    const np = typeof selectedProduct.price === 'number' ? selectedProduct.price : Number(String(selectedProduct.price).replace(/[^0-9]/g, ""))
    const productImage = Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? selectedProduct.images[0] : selectedProduct.image
    setCart(prev => { const ex = prev.find(i => i.id === selectedProduct.id); return ex ? prev.map(i => i.id === selectedProduct.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...selectedProduct, image: productImage, price: np, quantity: 1, shop }] })
    trackCartAddition(selectedProduct); alert("Added to Cart! 🛒")
  }

  const addToCartDirect = (product, shopName) => {
    const np = typeof product.price === 'number' ? product.price : Number(String(product.price).replace(/[^0-9]/g, ""))
    const productImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image
    setCart(prev => { const ex = prev.find(i => i.id === product.id); return ex ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...product, image: productImage, price: np, quantity: 1, shop: shopName }] })
    trackCartAddition(product); alert("Added to Cart! 🛒")
  }

  const updateQuantity = (id, amt) => { setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + amt } : i).filter(i => i.quantity > 0)) }
  const cartGroupedByShop = cart.reduce((g, i) => { const s = i.shop || "Unknown"; if (!g[s]) g[s] = []; g[s].push(i); return g }, {})

  const handleWhatsAppOrder = (sn, p) => {
    trackWhatsAppClick(sn); trackLead(p.name, sn, "WhatsApp Order")
    window.open(`https://wa.me/${getShopWhatsApp(sn)}?text=${encodeURIComponent(`Habari ${sn}, nataka ${p.name} - ${p.price}\nKupitia Baizona.com.`)}`, "_blank")
  }

  const handleShopCheckoutWhatsApp = (sn, items) => {
    trackWhatsAppClick(sn); items.forEach(i => trackLead(i.name, sn, "Cart Checkout"))
    let txt = "", total = 0
    items.forEach((i, idx) => { const st = i.price * i.quantity; total += st; txt += `${idx + 1}. ${i.name} (X${i.quantity}) - Tsh ${st.toLocaleString()}\n` })
    window.open(`https://wa.me/${getShopWhatsApp(sn)}?text=${encodeURIComponent(`🚀 ORDER FROM BAIZONA\n\n${txt}\n💰 Total: Tsh ${total.toLocaleString()}`)}`, "_blank")
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginShopName || !loginPassword) { setLoginError("Fill in shop name and password!"); return }
    const shop = dbShops.find(s => s.name.toLowerCase() === loginShopName.toLowerCase())
    if (!shop) { setLoginError("Shop not found!"); return }
    if (shop.password !== loginPassword) { setLoginError("Wrong password!"); return }
    setIsLoggedIn(true); setIsAdmin(false); setLoggedInShop(shop); setShopStats(await calculateShopStats(shop.name))
    localStorage.setItem("baizona_auth", JSON.stringify({ shopName: shop.name, password: shop.password, isAdmin: false }))
    setLoginShopName(""); setLoginPassword("")
  }

  const handleAdminLogin = (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginEmail || !loginAdminPassword) { setLoginError("Fill in email and password!"); return }
    if (loginEmail === ADMIN_EMAIL && loginAdminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true); setIsLoggedIn(true); setLoginEmail(""); setLoginAdminPassword(""); setPage("dashboard")
      localStorage.setItem("baizona_auth", JSON.stringify({ isAdmin: true }))
      calculateAdminStats().then(s => setAdminStats(s))
    } else setLoginError("Wrong email or password!")
  }

  const handleLogout = () => {
    setIsLoggedIn(false); setLoggedInShop(null); setIsAdmin(false)
    setShopStats({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
    setLoginError(""); setAdminTab("overview"); setPage("home"); setShowProfileSettings(false)
    localStorage.removeItem("baizona_auth")
  }

  const handleAddShop = async (e) => {
    e.preventDefault(); setAdminMessage("")
    if (!newShopData.name || !newShopData.password || !newShopData.category) { setAdminMessage("❌ Fill in: Name, Category, and Password!"); return }
    const { error } = await supabase.from('shops').insert([{
      name: newShopData.name, logo: newShopData.logo || "🏪", category: newShopData.category,
      description: newShopData.description || "No description yet.", location: newShopData.location || "",
      phone: newShopData.phone || "", email: newShopData.email || "",
      working_hours: newShopData.working_hours || "Mon - Sat: 8:00 AM - 6:00 PM",
      rating: newShopData.rating || "4.0", password: newShopData.password
    }])
    if (error) { setAdminMessage("❌ Failed: " + error.message) }
    else { setAdminMessage("✅ Shop added!"); setNewShopData({ name: "", logo: "", category: "", description: "", location: "", phone: "", email: "", working_hours: "Mon - Sat: 8:00 AM - 6:00 PM", rating: "4.0", password: "" }); fetchShops() }
  }

  const handleUpdateShop = async (e) => {
    e.preventDefault()
    if (!editingShop?.name) { alert("Name required!"); return }
    const { error } = await supabase.from('shops').update({
      name: editingShop.name, logo: editingShop.logo, category: editingShop.category,
      description: editingShop.description, location: editingShop.location,
      phone: editingShop.phone, email: editingShop.email,
      working_hours: editingShop.working_hours, rating: editingShop.rating, password: editingShop.password
    }).eq('id', editingShop.id)
    if (error) alert("Failed: " + error.message)
    else { setEditingShop(null); fetchShops(); alert("✅ Saved!") }
  }

  const handleDeleteShop = async (id, name) => {
    if (confirm(`Delete "${name}" PERMANENTLY?`)) {
      await supabase.from('products').delete().eq('shop', name)
      await supabase.from('leads').delete().eq('shop_name', name)
      await supabase.from('analytics').delete().eq('shop_name', name)
      const { error } = await supabase.from('shops').delete().eq('id', id)
      if (error) alert("Failed: " + error.message)
      else { fetchShops(); fetchProducts(); fetchLeads(); alert("✅ Deleted!") }
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) { alert("Fill in name and price!"); return }
    const imagesJson = JSON.stringify(newProduct.images || [])
    const { error } = await supabase.from('products').insert([{
      name: newProduct.name, price: newProduct.price,
      description: newProduct.description || "No description.",
      images: imagesJson,
      image: newProduct.images && newProduct.images.length > 0 ? newProduct.images[0] : "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500",
      shop: loggedInShop?.name || newProduct.shop,
      category: newProduct.category || "Other"
    }])
    if (error) alert("Failed: " + error.message)
    else { alert("✅ Added!"); setNewProduct({ name: "", price: "", description: "", images: [], shop: loggedInShop?.name || "", category: "" }); fetchProducts(); if (loggedInShop) setShopStats(await calculateShopStats(loggedInShop.name)) }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    const { id, name, price, description, images, shop, category } = editingProduct
    const imagesJson = JSON.stringify(images || [])
    const { error } = await supabase.from('products').update({ name, price, description, images: imagesJson, image: images && images.length > 0 ? images[0] : "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500", shop, category }).eq('id', id)
    if (error) alert("Failed: " + error.message)
    else { alert("✅ Saved!"); setEditingProduct(null); fetchProducts() }
  }

  const handleDeleteProduct = async (pid) => {
    if (confirm("Delete this product?")) {
      const { error } = await supabase.from('products').delete().eq('id', pid)
      if (error) alert("Failed: " + error.message)
      else { fetchProducts(); alert("✅ Deleted!") }
    }
  }

  const navigateTo = (p) => { setPage(p); setShowProfileSettings(false); setSelectedCategory("All") }

  const openProfileSettings = () => {
    setProfileForm({ owner_name: loggedInShop?.owner_name || "", phone: loggedInShop?.phone || "", email: loggedInShop?.email || "", current_password: "", new_password: "", confirm_password: "" })
    setProfileMessage(""); setShowProfileSettings(true)
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setProfileMessage("")
    if (profileForm.current_password !== loggedInShop?.password) { setProfileMessage("❌ Current password is wrong!"); return }
    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) { setProfileMessage("❌ New passwords don't match!"); return }
    const updateData = { phone: profileForm.phone, email: profileForm.email, owner_name: profileForm.owner_name }
    if (profileForm.new_password) updateData.password = profileForm.new_password
    const { error } = await supabase.from('shops').update(updateData).eq('id', loggedInShop.id)
    if (error) setProfileMessage("❌ Failed: " + error.message)
    else { setProfileMessage("✅ Profile updated!"); const { data } = await supabase.from('shops').select('*').eq('id', loggedInShop.id).single(); if (data) { setLoggedInShop(data); localStorage.setItem("baizona_auth", JSON.stringify({ shopName: data.name, password: data.password, isAdmin: false })) } }
  }

  const compactGrid = { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))", gap: isMobile ? "8px" : "12px", marginTop: "10px" }
  const horizontalScroll = { display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "10px", scrollbarWidth: "thin" }
  const inputStyle = { width: "100%", padding: isMobile ? "10px" : "9px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "13px", outline: "none" }
  const btn = (bg, c = "white") => ({ padding: isMobile ? "12px 16px" : "10px 16px", borderRadius: "10px", background: bg, color: c, border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "13px", width: "100%" })

  const homeIcon = (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#38bdf8" : "#94a3b8"}>
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke={active ? "#38bdf8" : "#94a3b8"} strokeWidth="2" fill="none"/>
    </svg>
  )

  const shopIcon = (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#38bdf8" : "#94a3b8"}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
      <path d="M9 22V12h6v10" stroke="#0f172a" strokeWidth="2" fill="none"/>
    </svg>
  )

  const cartIcon = (active, count) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#38bdf8" : "#94a3b8"} strokeWidth="2">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
    </svg>
  )

  const dashIcon = (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#a855f7" : "#94a3b8"} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )

  const mapIcon = (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#22c55e" : "#94a3b8"} strokeWidth="2">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Arial, sans-serif", paddingBottom: isMobile ? "75px" : "0px" }}>

      {/* TOP HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "12px 15px" : "14px 25px", background: "rgba(15,23,42,0.95)", position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => navigateTo("home")}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "14px" }}>B</div>
          <span style={{ fontWeight: "bold", fontSize: isMobile ? "18px" : "20px", background: "linear-gradient(to right,#60a5fa,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Baizona</span>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", gap: "20px", alignItems: "center", fontWeight: "bold", fontSize: "13px" }}>
            {["home","shops","map","cart","dashboard"].map(p => (
              <span key={p} onClick={() => navigateTo(p)} style={{ cursor: "pointer", color: page === p ? "#38bdf8" : "#cbd5e1", textTransform: "capitalize" }}>
                {p === "home" ? "🏠 Home" : p === "shops" ? "🏪 Shops" : p === "map" ? "🗺️ Map" : p === "cart" ? `🛒 Cart (${cart.reduce((a,b)=>a+b.quantity,0)})` : "📊 Dashboard"}
              </span>
            ))}
            {isLoggedIn && <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>Logout</button>}
          </div>
        )}
      </div>

      {/* ============ HOME PAGE ============ */}
      {page === "home" && (
        <>
          <div style={{ padding: isMobile ? "8px 12px" : "10px 20px", overflowX: "auto", whiteSpace: "nowrap" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {productCategories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", border: "none",
                  background: selectedCategory === cat ? "#3b82f6" : "rgba(255,255,255,0.06)", color: "white", whiteSpace: "nowrap", flexShrink: 0
                }}>{cat === "All" ? "🌟 All" : cat}</button>
              ))}
            </div>
          </div>

          <div style={{ padding: isMobile ? "6px 12px" : "8px 20px" }}>
            <input type="text" placeholder="🔍 Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", maxWidth: "500px", padding: isMobile ? "10px" : "11px", borderRadius: "25px", border: "none", outline: "none", fontSize: "12px", background: "rgba(255,255,255,0.08)", color: "white", display: "block", margin: "0 auto" }} />
          </div>

          <div style={{ padding: isMobile ? "8px 12px" : "10px 20px" }}>
            <h2 style={{ fontSize: isMobile ? "13px" : "16px", marginBottom: "6px" }}>🏪 Popular Shops</h2>
            <div style={horizontalScroll}>
              {filteredShops.slice(0, 8).map((shop, i) => (
                <div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ minWidth: isMobile ? "120px" : "160px", padding: isMobile ? "12px" : "14px", borderRadius: "12px", background: "linear-gradient(135deg,#1e3a5f,#2d1b69)", cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
                  {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", marginBottom: "4px" }} /> : <div style={{ fontSize: "28px" }}>{shop.logo || "🏪"}</div>}
                  <div style={{ fontWeight: "bold", fontSize: "11px" }}>{shop.name}</div>
                  <div style={{ fontSize: "9px", color: "#94a3b8" }}>{shop.category}</div>
                  <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px" }}>📍 {shop.location || "Kariakoo"}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: isMobile ? "8px 12px" : "10px 20px" }}>
            <h2 style={{ fontSize: isMobile ? "13px" : "16px", marginBottom: "6px" }}>{searchQuery || selectedCategory !== "All" ? `Results (${filteredProducts.length})` : "✨ Trending Products"}</h2>
            <div style={compactGrid}>
              {filteredProducts.map(product => {
                const productImages = product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : [product.image]
                const displayImage = productImages && productImages.length > 0 ? productImages[0] : (product.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500")
                const shopLocation = getShopLocation(product.shop)
                return (
                  <div key={product.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ height: isMobile ? "100px" : "130px", overflow: "hidden" }} onClick={() => { setSelectedProduct({...product, images: productImages, image: displayImage}); trackProductView(product); navigateTo("productDetails") }}>
                      <img src={displayImage} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "7px" }}>
                      <span style={{ fontSize: "8px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "1px 5px", borderRadius: "8px" }}>{product.shop}</span>
                      <div style={{ fontSize: "7px", color: "#64748b", marginTop: "2px" }}>📍 {shopLocation}</div>
                      <h3 style={{ margin: "3px 0", fontSize: "11px", fontWeight: "bold" }}>{product.name.length > 22 ? product.name.substring(0,22)+'...' : product.name}</h3>
                      <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "11px", margin: "2px 0" }}>{product.price}</p>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedProduct({...product, images: productImages, image: displayImage}); trackProductView(product); navigateTo("productDetails") }} style={{ ...btn("linear-gradient(to right,#3b82f6,#8b5cf6)"), padding: "5px", fontSize: "9px", marginTop: "3px" }}>View 👀</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ============ SHOPS PAGE ============ */}
      {page === "shops" && (
        <div style={{ padding: isMobile ? "12px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "18px" : "24px", marginBottom: "8px" }}>Explore Shops 🏪</h1>
          
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", marginBottom: "10px" }}>
            {productCategories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                padding: "5px 12px", borderRadius: "16px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", border: "none",
                background: selectedCategory === cat ? "#3b82f6" : "rgba(255,255,255,0.06)", color: "white", whiteSpace: "nowrap", flexShrink: 0
              }}>{cat === "All" ? "🌟 All" : cat}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {filteredShops.map((shop, i) => (
              <div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px", cursor: "pointer", textAlign: "center" }}>
                {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", marginBottom: "4px" }} /> : <div style={{ fontSize: "28px" }}>{shop.logo || "🏪"}</div>}
                <h3 style={{ fontSize: "12px", margin: "4px 0" }}>{shop.name}</h3>
                <span style={{ fontSize: "9px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 7px", borderRadius: "8px" }}>{shop.category}</span>
                <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px" }}>⭐ {shop.rating} • 📦 {dbProducts.filter(p => p.shop === shop.name).length}</div>
                <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px" }}>📍 {shop.location || "Kariakoo"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ 3D MAP PAGE ============ */}
      {page === "map" && (
        <div style={{ padding: isMobile ? "10px" : "20px", height: "calc(100vh - 120px)", minHeight: "550px" }}>
          <h1 style={{ fontSize: isMobile ? "18px" : "24px", marginBottom: "12px" }}>🗺️ Interactive 3D Map - Kariakoo</h1>
          <div style={{ height: "calc(100% - 40px)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
            <Kariakoo3DMap 
              shops={dbShops}
              selectedShop={selectedShop}
              onShopSelect={(shop) => {
                setSelectedShop(shop)
                navigateTo("shopProfile")
              }}
            />
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
            💡 Tip: Click on any shop marker to view details | Use mouse to rotate and zoom
          </div>
        </div>
      )}

      {/* ============ SHOP PROFILE ============ */}
      {page === "shopProfile" && selectedShop && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("shops")} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "10px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back to Shops</button>
          <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "12px", padding: isMobile ? "12px" : "18px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
            {selectedShop.logo && selectedShop.logo.startsWith("http") ? <img src={selectedShop.logo} alt={selectedShop.name} style={{ width: "45px", height: "45px", borderRadius: "10px", objectFit: "cover" }} /> : <div style={{ width: "45px", height: "45px", borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "22px" }}>{selectedShop.logo || "🏪"}</div>}
            <div>
              <h1 style={{ fontSize: isMobile ? "15px" : "20px", margin: 0 }}>{selectedShop.name}</h1>
              <span style={{ fontSize: "9px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 7px", borderRadius: "8px" }}>{selectedShop.category}</span>
              <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>⭐ {selectedShop.rating} • 📞 {selectedShop.phone}</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "10px", marginBottom: "12px", fontSize: "11px", color: "#cbd5e1" }}>
            <p style={{ margin: "0 0 4px 0" }}>📍 {selectedShop.location || "Kariakoo, Dar es Salaam"}</p>
            <p style={{ margin: 0 }}>📧 {selectedShop.email} | 🕐 {selectedShop.working_hours}</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#94a3b8" }}>{selectedShop.description}</p>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <button onClick={() => { setPage("map"); setSelectedShop(selectedShop); }} style={{ ...btn("rgba(34,197,94,0.2)"), width: "auto", padding: "8px 16px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              🗺️ View on 3D Map
            </button>
          </div>
          <h2 style={{ fontSize: isMobile ? "12px" : "15px", marginBottom: "6px" }}>📦 Products ({dbProducts.filter(p => p.shop === selectedShop.name).length})</h2>
          <div style={compactGrid}>
            {dbProducts.filter(p => p.shop === selectedShop.name).map(product => {
              const productImages = product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : [product.image]
              const displayImage = productImages && productImages.length > 0 ? productImages[0] : product.image
              return (
                <div key={product.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ height: isMobile ? "90px" : "120px", overflow: "hidden" }} onClick={() => { setSelectedProduct({...product, images: productImages, image: displayImage}); trackProductView(product); navigateTo("productDetails") }}>
                    <img src={displayImage} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "7px" }}>
                    <h3 style={{ fontSize: "10px", margin: "2px 0" }}>{product.name.length > 18 ? product.name.substring(0,18)+'...' : product.name}</h3>
                    <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "10px", margin: "2px 0" }}>{product.price}</p>
                    <button onClick={() => addToCartDirect(product, selectedShop.name)} style={{ ...btn("linear-gradient(to right, #3b82f6, #8b5cf6)"), padding: "4px", fontSize: "9px" }}>🛒 Add</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ============ PRODUCT DETAILS ============ */}
      {page === "productDetails" && selectedProduct && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "700px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("home")} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "10px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back</button>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "flex", overflowX: "auto", gap: "4px", padding: "8px", background: "rgba(0,0,0,0.3)" }}>
              {(selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image]).map((img, idx) => (
                <img key={idx} src={img} alt={`${selectedProduct.name} - ${idx + 1}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", border: idx === 0 ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.2)" }} />
              ))}
            </div>
            <div style={{ padding: isMobile ? "10px" : "16px" }}>
              <span style={{ color: "#a855f7", fontSize: "10px" }}>🏪 {selectedShop?.name || selectedProduct.shop}</span>
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>📍 {getShopLocation(selectedShop?.name || selectedProduct.shop)}</div>
              <h1 style={{ fontSize: isMobile ? "16px" : "20px", margin: "4px 0" }}>{selectedProduct.name}</h1>
              <h2 style={{ color: "#38bdf8", fontSize: isMobile ? "16px" : "20px", margin: "2px 0" }}>{selectedProduct.price}</h2>
              <p style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "6px" }}>{selectedProduct.description}</p>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "8px", marginTop: "10px" }}>
                <button onClick={addToCart} style={{ ...btn("transparent"), border: "1px solid #3b82f6" }}>🛒 Add to Cart</button>
                <button onClick={() => handleWhatsAppOrder(selectedShop?.name || selectedProduct.shop, selectedProduct)} style={btn("linear-gradient(to right,#22c55e,#16a34a)")}>📱 Order via WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ CART PAGE ============ */}
      {page === "cart" && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "18px" : "22px" }}>Cart 🛒</h1>
          {cart.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "30px", borderRadius: "10px", marginTop: "10px", textAlign: "center", fontSize: "12px" }}>Cart is empty</div>
          ) : (
            Object.keys(cartGroupedByShop).map((sn) => {
              const items = cartGroupedByShop[sn]
              const total = items.reduce((s, i) => s + (i.price * i.quantity), 0)
              return (
                <div key={sn} style={{ background: "rgba(30,41,59,0.5)", padding: "10px", borderRadius: "12px", marginBottom: "10px", marginTop: "10px" }}>
                  <h3 style={{ fontSize: "12px", color: "#38bdf8", marginBottom: "6px" }}>🏪 {sn}</h3>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "10px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><img src={item.image} style={{ width: "30px", height: "30px", borderRadius: "5px", objectFit: "cover" }} /><span>{item.name} <span style={{ color: "#38bdf8" }}>x{item.quantity}</span></span></div>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "#ef4444", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "10px" }}>-</button>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "#22c55e", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "10px" }}>+</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <strong style={{ fontSize: "12px", color: "#38bdf8" }}>Tsh {total.toLocaleString()}</strong>
                    <button onClick={() => handleShopCheckoutWhatsApp(sn, items)} style={{ ...btn("linear-gradient(to right, #22c55e, #16a34a)"), width: "auto", padding: "7px 12px", fontSize: "10px" }}>Send Order 📱</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ============ DASHBOARD ============ */}
      {page === "dashboard" && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          {!isLoggedIn ? (
            <div style={{ maxWidth: "400px", margin: "30px auto" }}>
              <div style={{ background: "rgba(30,41,59,0.8)", padding: "20px", borderRadius: "16px" }}>
                <div style={{ textAlign: "center", marginBottom: "14px" }}>
                  <div style={{ fontSize: "28px" }}>🔐</div>
                  <h2 style={{ fontSize: "18px", margin: "4px 0" }}>{isAdminMode ? "Admin Access" : "Shop Login"}</h2>
                </div>
                {isAdminMode ? (
                  <form onSubmit={handleAdminLogin}>
                    {loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "6px", borderRadius: "6px", marginBottom: "6px", fontSize: "10px", textAlign: "center" }}>{loginError}</div>}
                    <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ ...inputStyle, marginBottom: "6px" }} />
                    <input type="password" placeholder="Password" value={loginAdminPassword} onChange={(e) => setLoginAdminPassword(e.target.value)} style={{ ...inputStyle, marginBottom: "10px" }} />
                    <button type="submit" style={btn("linear-gradient(to right, #dc2626, #ef4444)")}>Login 🔑</button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin}>
                    {loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "6px", borderRadius: "6px", marginBottom: "6px", fontSize: "10px" }}>{loginError}</div>}
                    <div style={{ marginBottom: "6px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Shop Name</label><input type="text" placeholder="Enter shop name..." value={loginShopName} onChange={(e) => setLoginShopName(e.target.value)} style={inputStyle} /></div>
                    <div style={{ marginBottom: "10px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Password</label><input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} /></div>
                    <button type="submit" style={btn("linear-gradient(to right, #3b82f6, #8b5cf6)")}>Login 📊</button>
                  </form>
                )}
              </div>
              <div style={{ marginTop: "14px", textAlign: "center" }}>
                <a href="https://wa.me/255698656019?text=Hi%20I%20want%20to%20support%20Baizona!" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "25px", background: "linear-gradient(to right, #22c55e, #16a34a)", color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "12px" }}>💚 Support Baizona</a>
              </div>
            </div>
          ) : isAdmin ? (
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div style={{ background: "linear-gradient(135deg, #1e1e3f, #2d1b4e)", borderRadius: "12px", padding: "14px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "24px" }}>🛡️</span>
                  <div><strong style={{ fontSize: "15px" }}>Baizona Admin</strong><p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>{dbShops.length} shops • {dbProducts.length} products</p></div>
                </div>
                <button onClick={handleLogout} style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.2)", color: "#f87171", border: "none", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}>🚪 Logout</button>
              </div>

              <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
                {[
                  { id: "overview", icon: "📈", label: "Overview" },
                  { id: "addShop", icon: "🏪", label: "+ Add Shop" },
                  { id: "manageShops", icon: "⚙️", label: "Shops List" },
                  { id: "leads", icon: "📨", label: "Leads" },
                  { id: "categories", icon: "🏷️", label: "Categories" }
                ].map(tab => (
                  <button key={tab.id} onClick={() => { setAdminTab(tab.id); setAdminMessage(""); setEditingShop(null) }} style={{
                    padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", border: "none",
                    background: adminTab === tab.id ? "#3b82f6" : "rgba(255,255,255,0.06)", color: "white"
                  }}>{tab.icon} {tab.label}</button>
                ))}
              </div>

              {adminMessage && (
                <div style={{ background: adminMessage.startsWith("✅") ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: adminMessage.startsWith("✅") ? "#4ade80" : "#f87171", padding: "10px", borderRadius: "8px", marginBottom: "10px", fontSize: "12px", textAlign: "center" }}>{adminMessage}</div>
              )}

              {adminTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "8px" }}>
                  {[{ icon: "🏪", label: "Shops", value: adminStats.totalShops, color: "#3b82f6" },{ icon: "📦", label: "Products", value: adminStats.totalProducts, color: "#22c55e" },{ icon: "👁️", label: "Views", value: adminStats.totalViews, color: "#38bdf8" },{ icon: "💬", label: "WA Clicks", value: adminStats.totalWhatsappClicks, color: "#34d399" },{ icon: "🛒", label: "Cart", value: adminStats.totalCartAdditions, color: "#a78bfa" },{ icon: "📨", label: "Leads", value: adminStats.totalLeads, color: "#fbbf24" }].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "22px" }}>{s.icon}</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === "categories" && (
                <div style={{ background: "rgba(30,41,59,0.6)", padding: "16px", borderRadius: "12px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#fbbf24" }}>🏷️ Manage Categories</h3>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <input type="text" placeholder="Enter new category..." value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} style={{ flex: 1, ...inputStyle }} />
                    <button onClick={addNewCategory} style={{ ...btn("#22c55e"), width: "auto", padding: "10px 20px" }}>➕ Add Category</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {productCategories.filter(c => c !== "All").map(cat => (
                      <div key={cat} style={{ background: "rgba(59,130,246,0.2)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{cat}</span>
                        <button onClick={() => { if (confirm(`Delete category "${cat}"?`)) setProductCategories(productCategories.filter(c => c !== cat)) }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "14px" }}>✖️</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === "addShop" && (
                <div style={{ background: "rgba(30,41,59,0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#4ade80" }}>🏪 Add New Shop</h3>
                  <form onSubmit={handleAddShop} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "10px" }}>
                    <div style={{ gridColumn: isMobile ? "span 1" : "span 2", textAlign: "center" }}>
                      <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Shop Logo/Image</label>
                      {newShopData.logo && newShopData.logo.startsWith("http") ? <img src={newShopData.logo} style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", marginBottom: "4px", border: "2px solid rgba(255,255,255,0.2)" }} /> : <div style={{ width: "80px", height: "80px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: "30px", marginBottom: "4px" }}>🏪</div>}
                      <input type="file" accept="image/*" onChange={async (e) => { const url = await handleImageUpload(e.target.files[0], (imgUrl) => setNewShopData({...newShopData, logo: imgUrl}), 'shop'); if (url) setNewShopData({...newShopData, logo: url}) }} style={inputStyle} disabled={uploadingImage} />
                      {uploadingImage && <div style={{fontSize: "11px", color: "#38bdf8", marginTop: "4px"}}>⏳ Inapakia picha...</div>}
                    </div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Shop Name *</label><input type="text" placeholder="e.g. Kariakoo Electronics" value={newShopData.name} onChange={(e) => setNewShopData({...newShopData, name: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Category *</label>
                      <select value={newShopData.category} onChange={(e) => setNewShopData({...newShopData, category: e.target.value})} style={{...inputStyle, background: "#1e293b"}}>
                        {productCategories.filter(c=>c!=="All").map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Password *</label><input type="text" placeholder="Shop password" value={newShopData.password} onChange={(e) => setNewShopData({...newShopData, password: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Phone (WhatsApp) *</label><input type="text" placeholder="e.g. 255712345678" value={newShopData.phone} onChange={(e) => setNewShopData({...newShopData, phone: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Email</label><input type="text" placeholder="e.g. shop@example.com" value={newShopData.email} onChange={(e) => setNewShopData({...newShopData, email: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Location</label><input type="text" placeholder="e.g. Kariakoo, Dar" value={newShopData.location} onChange={(e) => setNewShopData({...newShopData, location: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Working Hours</label><input type="text" placeholder="e.g. 8AM - 6PM" value={newShopData.working_hours} onChange={(e) => setNewShopData({...newShopData, working_hours: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Description</label><textarea placeholder="Shop description..." value={newShopData.description} onChange={(e) => setNewShopData({...newShopData, description: e.target.value})} style={{...inputStyle, minHeight: "60px"}} /></div>
                    <div style={{ gridColumn: isMobile ? "span 1" : "span 2", display: "flex", gap: "8px" }}>
                      <button type="submit" style={btn("#22c55e")}>💾 Save Shop</button>
                      <button type="button" onClick={() => setNewShopData({ name: "", logo: "", category: "", description: "", location: "", phone: "", email: "", working_hours: "Mon - Sat: 8:00 AM - 6:00 PM", rating: "4.0", password: "" })} style={btn("gray")}>🔄 Clear</button>
                    </div>
                  </form>
                </div>
              )}

              {adminTab === "manageShops" && (
                <div>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>⚙️ Shops List ({dbShops.length})</h3>
                  {editingShop && (
                    <div style={{ background: "rgba(30,41,59,0.9)", padding: "14px", borderRadius: "10px", marginBottom: "10px", border: "1px solid rgba(251,191,36,0.3)" }}>
                      <h4 style={{ fontSize: "13px", color: "#fbbf24", marginBottom: "8px" }}>✏️ Edit: {editingShop.name}</h4>
                      <form onSubmit={handleUpdateShop} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "8px" }}>
                        <div style={{ gridColumn: isMobile ? "span 1" : "span 2", textAlign: "center" }}>
                          {editingShop.logo && editingShop.logo.startsWith("http") && <img src={editingShop.logo} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", marginBottom: "4px" }} />}
                          <input type="file" accept="image/*" onChange={async (e) => { const url = await handleImageUpload(e.target.files[0], (imgUrl) => setEditingShop({...editingShop, logo: imgUrl}), 'shop'); if (url) setEditingShop({...editingShop, logo: url}) }} style={inputStyle} disabled={uploadingImage} />
                        </div>
                        <input type="text" placeholder="Name" value={editingShop.name} onChange={(e) => setEditingShop({...editingShop, name: e.target.value})} style={inputStyle} />
                        <select value={editingShop.category} onChange={(e) => setEditingShop({...editingShop, category: e.target.value})} style={{...inputStyle, background: "#1e293b"}}>
                          {productCategories.filter(c=>c!=="All").map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="text" placeholder="Password" value={editingShop.password} onChange={(e) => setEditingShop({...editingShop, password: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Phone" value={editingShop.phone} onChange={(e) => setEditingShop({...editingShop, phone: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Email" value={editingShop.email} onChange={(e) => setEditingShop({...editingShop, email: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Location" value={editingShop.location} onChange={(e) => setEditingShop({...editingShop, location: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Working Hours" value={editingShop.working_hours} onChange={(e) => setEditingShop({...editingShop, working_hours: e.target.value})} style={inputStyle} />
                        <textarea placeholder="Description" value={editingShop.description} onChange={(e) => setEditingShop({...editingShop, description: e.target.value})} style={{...inputStyle, gridColumn: isMobile ? "span 1" : "span 2", minHeight: "50px"}} />
                        <div style={{ gridColumn: isMobile ? "span 1" : "span 2", display: "flex", gap: "8px" }}>
                          <button type="submit" style={btn("#fbbf24", "black")}>💾 Save</button>
                          <button type="button" onClick={() => setEditingShop(null)} style={btn("gray")}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {dbShops.map((shop, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", overflow: "hidden" }}>
                        <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                          {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "55px", height: "55px", borderRadius: "12px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0 }} /> : <div style={{ width: "55px", height: "55px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "22px", flexShrink: 0 }}>{shop.logo || "🏪"}</div>}
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "13px" }}>{shop.name}</strong>
                            <div style={{ fontSize: "10px", color: "#94a3b8" }}>{shop.category} | 📦 {dbProducts.filter(p => p.shop === shop.name).length} products</div>
                            <div style={{ fontSize: "9px", color: "#64748b" }}>📍 {shop.location || "Kariakoo"} | 📞 {shop.phone}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button onClick={() => setEditingShop({...shop})} style={{ background: "#fbbf24", color: "black", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}>✏️ Edit</button>
                            <button onClick={() => handleDeleteShop(shop.id, shop.name)} style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}>🗑️ Delete</button>
                          </div>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px", background: "rgba(0,0,0,0.15)" }}>
                          <h5 style={{ fontSize: "11px", marginBottom: "8px", color: "#60a5fa" }}>📦 Add Product to {shop.name}</h5>
                          <form onSubmit={async (e) => {
                            e.preventDefault()
                            if (!adminNewProduct.name || !adminNewProduct.price) { setAdminMessage("❌ Fill in name and price!"); return }
                            const imagesJson = JSON.stringify(adminNewProduct.images || [])
                            const { error } = await supabase.from('products').insert([{ 
                              name: adminNewProduct.name, price: adminNewProduct.price, description: adminNewProduct.description || "", 
                              images: imagesJson, image: adminNewProduct.images && adminNewProduct.images.length > 0 ? adminNewProduct.images[0] : "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500", 
                              shop: shop.name, category: adminNewProduct.category || "Other"
                            }])
                            if (error) setAdminMessage("❌ Failed: " + error.message)
                            else { setAdminMessage(`✅ Product added to ${shop.name}!`); setAdminNewProduct({ name: "", price: "", description: "", images: [], category: "" }); fetchProducts() }
                          }} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              <input type="text" placeholder="Product name" value={adminNewProduct.name} onChange={(e) => setAdminNewProduct({...adminNewProduct, name: e.target.value})} style={{ flex: "2", ...inputStyle }} />
                              <input type="text" placeholder="Price" value={adminNewProduct.price} onChange={(e) => setAdminNewProduct({...adminNewProduct, price: e.target.value})} style={{ flex: "1", ...inputStyle }} />
                              <input type="text" placeholder="Category" value={adminNewProduct.category} onChange={(e) => setAdminNewProduct({...adminNewProduct, category: e.target.value})} style={{ flex: "1", ...inputStyle }} list="product-categories" />
                              <datalist id="product-categories">{productCategories.filter(c => c !== "All").map(cat => <option key={cat} value={cat} />)}</datalist>
                            </div>
                            <div>
                              <input type="file" accept="image/*" multiple onChange={async (e) => { await handleMultipleImagesUpload(e.target.files, adminNewProduct.images || [], (newImages) => setAdminNewProduct({...adminNewProduct, images: newImages})) }} style={inputStyle} disabled={uploadingMultiple} />
                              {uploadingMultiple && <div style={{fontSize: "11px", color: "#38bdf8", marginTop: "4px"}}>⏳ Inapakia picha...</div>}
                              {adminNewProduct.images && adminNewProduct.images.length > 0 && (
                                <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                                  {adminNewProduct.images.map((img, idx) => (
                                    <div key={idx} style={{ position: "relative" }}>
                                      <img src={img} style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
                                      <button type="button" onClick={() => setAdminNewProduct({...adminNewProduct, images: adminNewProduct.images.filter((_, i) => i !== idx)})} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", cursor: "pointer" }}>✖️</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <textarea placeholder="Description" value={adminNewProduct.description} onChange={(e) => setAdminNewProduct({...adminNewProduct, description: e.target.value})} style={{...inputStyle, minHeight: "50px"}} />
                            <button type="submit" style={{ ...btn("linear-gradient(to right, #3b82f6, #8b5cf6)"), padding: "8px" }}>➕ Add Product</button>
                          </form>
                          <div style={{ marginTop: "10px", maxHeight: "200px", overflowY: "auto" }}>
                            {dbProducts.filter(p => p.shop === shop.name).map(prod => {
                              const prodImages = prod.images ? (typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images) : [prod.image]
                              return (
                                <div key={prod.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", fontSize: "10px", marginBottom: "4px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {prodImages.length > 0 && <img src={prodImages[0]} style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} />}
                                    <span>{prod.name}</span>
                                    <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{prod.price}</span>
                                    <span style={{ fontSize: "8px", color: "#64748b" }}>({prod.category || "Other"})</span>
                                  </div>
                                  <button onClick={() => handleDeleteProduct(prod.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === "leads" && (
                <div>
                  <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>📨 All Leads ({dbLeads.length})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {dbLeads.length === 0 ? <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px", fontSize: "11px" }}>No leads yet</p> :
                      dbLeads.map(lead => (
                        <div key={lead.id} style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", flexWrap: "wrap", gap: "6px" }}>
                          <div><strong>{lead.product_name}</strong><div style={{ color: "#94a3b8", fontSize: "9px" }}>🏪 {lead.shop_name} • {lead.customer_action}</div></div>
                          <span style={{ fontSize: "8px", padding: "2px 8px", borderRadius: "10px", background: lead.status === "New" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)", color: lead.status === "New" ? "#60a5fa" : "#4ade80" }}>{lead.status}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          ) : showProfileSettings ? (
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <button onClick={() => setShowProfileSettings(false)} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "14px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back</button>
              <div style={{ background: "rgba(30,41,59,0.7)", padding: "20px", borderRadius: "16px" }}>
                <h2 style={{ fontSize: "18px", marginBottom: "16px", textAlign: "center" }}>⚙️ Profile Settings</h2>
                {profileMessage && <div style={{ background: profileMessage.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: profileMessage.startsWith("✅") ? "#4ade80" : "#f87171", padding: "8px", borderRadius: "8px", marginBottom: "12px", fontSize: "11px", textAlign: "center" }}>{profileMessage}</div>}
                <form onSubmit={handleProfileUpdate}>
                  <div style={{ marginBottom: "10px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Shop Name</label><input type="text" value={loggedInShop?.name || ""} disabled style={{ ...inputStyle, opacity: 0.6 }} /></div>
                  <div style={{ marginBottom: "10px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Owner Name</label><input type="text" value={profileForm.owner_name} onChange={(e) => setProfileForm({...profileForm, owner_name: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div><label style={{ color: "#94a3b8", fontSize: "11px" }}>Phone</label><input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ color: "#94a3b8", fontSize: "11px" }}>Email</label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} style={inputStyle} /></div>
                  </div>
                  <hr style={{ borderColor: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
                  <h4 style={{ fontSize: "13px", marginBottom: "8px", color: "#fbbf24" }}>🔐 Change Password</h4>
                  <div style={{ marginBottom: "8px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Current Password *</label><input type="password" value={profileForm.current_password} onChange={(e) => setProfileForm({...profileForm, current_password: e.target.value})} required style={inputStyle} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div><label style={{ color: "#94a3b8", fontSize: "11px" }}>New Password</label><input type="password" value={profileForm.new_password} onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ color: "#94a3b8", fontSize: "11px" }}>Confirm</label><input type="password" value={profileForm.confirm_password} onChange={(e) => setProfileForm({...profileForm, confirm_password: e.target.value})} style={inputStyle} /></div>
                  </div>
                  <button type="submit" style={btn("linear-gradient(to right, #fbbf24, #f59e0b)", "black")}>💾 Save</button>
                </form>
              </div>
            </div>
          ) : (
            // SHOP OWNER DASHBOARD
            <>
              <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "10px", padding: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "14px" }}>{loggedInShop?.logo && loggedInShop.logo.startsWith("http") ? <img src={loggedInShop.logo} style={{ width: "20px", height: "20px", borderRadius: "4px", verticalAlign: "middle", marginRight: "4px", objectFit: "cover" }} /> : loggedInShop?.logo} {loggedInShop?.name}</strong>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={openProfileSettings} style={{ ...btn("rgba(255,255,255,0.15)"), width: "auto", padding: "6px 12px", fontSize: "10px" }}>⚙️ Settings</button>
                  <button onClick={() => { const s = dbShops.find(sh => sh.name === loggedInShop?.name); if (s) { setSelectedShop(s); navigateTo("shopProfile") } }} style={{ ...btn("rgba(255,255,255,0.15)"), width: "auto", padding: "6px 12px", fontSize: "10px" }}>🏪 View Shop</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginBottom: "8px" }}>
                {[{ l: "Views", v: shopStats.totalViews },{ l: "WA Clicks", v: shopStats.whatsappClicks },{ l: "Cart", v: shopStats.cartAdditions },{ l: "Products", v: shopStats.totalProducts }].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "8px", textAlign: "center", fontSize: "10px" }}><strong style={{ fontSize: "13px" }}>{s.v}</strong><br />{s.l}</div>
                ))}
              </div>
              <form onSubmit={handleAddProduct} style={{ background: "rgba(30,41,59,0.4)", padding: "10px", borderRadius: "10px", marginBottom: "8px" }}>
                <input type="text" placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} style={{...inputStyle, marginBottom: "5px"}} />
                <input type="text" placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} style={{...inputStyle, marginBottom: "5px"}} />
                <div style={{ marginBottom: "5px" }}>
                  <input type="text" placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} style={{...inputStyle, background: "#1e293b"}} list="product-categories-shop" />
                  <datalist id="product-categories-shop">{productCategories.filter(c => c !== "All").map(cat => <option key={cat} value={cat} />)}</datalist>
                </div>
                <div>
                  <input type="file" accept="image/*" multiple onChange={async (e) => { await handleMultipleImagesUpload(e.target.files, newProduct.images || [], (newImages) => setNewProduct({...newProduct, images: newImages})) }} style={{...inputStyle, marginBottom: "5px"}} disabled={uploadingMultiple} />
                  {uploadingMultiple && <div style={{fontSize: "11px", color: "#38bdf8", marginBottom: "5px"}}>⏳ Inapakia picha...</div>}
                  {newProduct.images && newProduct.images.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", marginBottom: "8px", flexWrap: "wrap" }}>
                      {newProduct.images.map((img, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <img src={img} style={{ width: "50px", height: "50px", borderRadius: "6px", objectFit: "cover" }} />
                          <button type="button" onClick={() => setNewProduct({...newProduct, images: newProduct.images.filter((_, i) => i !== idx)})} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer" }}>✖️</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} style={{...inputStyle, marginBottom: "5px", minHeight: "60px"}} />
                <button type="submit" style={btn("linear-gradient(to right, #22c55e, #16a34a)")}>➕ Add Product</button>
              </form>
              <div style={{ textAlign: "center", marginTop: "10px", padding: "10px", background: "rgba(34,197,94,0.04)", borderRadius: "10px" }}>
                <a href="https://wa.me/255698656019?text=Hi%20I%20want%20to%20support%20Baizona!" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "20px", background: "linear-gradient(to right, #22c55e, #16a34a)", color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "11px" }}>💚 Support Baizona</a>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============ MOBILE BOTTOM NAV ============ */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,23,42,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 5px 22px 5px", zIndex: 1000 }}>
          {[
            { id: "home", icon: homeIcon, label: "Home", color: "#38bdf8" },
            { id: "shops", icon: shopIcon, label: "Shops", color: "#38bdf8" },
            { id: "map", icon: mapIcon, label: "Map", color: "#22c55e" },
            { id: "cart", icon: cartIcon, label: "Cart", color: "#38bdf8", badge: cart.reduce((a,b)=>a+b.quantity,0) },
            { id: "dashboard", icon: dashIcon, label: "Dash", color: "#a855f7" }
          ].map(tab => (
            <div key={tab.id} onClick={() => navigateTo(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "3px", position: "relative", padding: "4px 12px" }}>
              {typeof tab.icon === 'function' ? tab.icon(page === tab.id, tab.badge) : <span style={{ fontSize: "20px" }}>{tab.icon}</span>}
              {tab.badge > 0 && (
                <span style={{ position: "absolute", top: "0px", right: "calc(50% - 16px)", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: "bold", minWidth: "16px", height: "16px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" }}>{tab.badge}</span>
              )}
              <span style={{ fontSize: "9px", fontWeight: page === tab.id ? "bold" : "normal", color: page === tab.id ? tab.color : "#94a3b8" }}>{tab.label}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}