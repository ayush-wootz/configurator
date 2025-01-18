import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialize scene
function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x444444);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(500, 500, 500);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.body.appendChild(renderer.domElement);
    
    return { scene, camera, renderer };
}

// Updated dimensions
const dims = {
    length: 1000,
    width: 300,
    height: 400,
    thickness: 2,
    // Handle dimensions
    basePlateWidth: 140,
    basePlateHeight: 100,
    basePlateThickness: 3,
    basePlateDepth: -10,
    handleWidth: 100,
    handleHeight: 40,
    handleTubeRadius: 6,
    handleDepth: -10,
    rubberThickness: 2,
    // Step dimensions
    stepHeight: 8,
    stepInset: 8
};
const config = {
   enableHemming: true,
   enableHandles: false,
   enablePerforation: false
};
// Materials
const materials = {
    steel: new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        metalness: 0.8,
        roughness: 0.3,
        side: THREE.DoubleSide
    }),
    darkSteel: new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.9,
        roughness: 0.2,
        side: THREE.DoubleSide
    }),
    rubber: new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.0,
        roughness: 0.9,
        side: THREE.DoubleSide
    })
};

// Create perforated wall
function createPerforatedWall(width, height, isHandleSide = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Make canvas size match wall dimensions (scaled up for better resolution)
    const scale = 10;
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    // Set background
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Parameters for holes with 10% reduced density
    const holeRadius = 3 * scale;  // 6mm diameter
    const holePitch = 12 * scale;  // 8.8mm pitch (10% increase from 8mm)
    const margin = holePitch;
    
    // Handle base plate dimensions (scaled)
    const handlePlateWidth = dims.basePlateWidth * scale;
    const handlePlateHeight = dims.basePlateHeight * scale;
    
    // Calculate number of holes
    const rows = Math.floor((height * scale - 2 * margin) / holePitch);
    const cols = Math.floor((width * scale - 2 * margin) / holePitch);
    
    // Draw holes
    ctx.fillStyle = 'black';
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = margin + j * holePitch + holePitch/2;
            const y = margin + i * holePitch + holePitch/2;
            
            // Skip holes in handle mounting areas if this is a handle side
            if (isHandleSide) {
                const handleCenterY = canvas.height/2;
                const handleCenterX = canvas.width/2;
                const inHandleArea = Math.abs(x - handleCenterX) < handlePlateWidth/2 && 
                                   Math.abs(y - handleCenterY) < handlePlateHeight/2;
                
                if (inHandleArea) continue;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create material with the perforated texture
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.8,
        roughness: 0.3,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        transparent: true
    });
    
    // Create wall mesh
    const geometry = new THREE.PlaneGeometry(width, height);
    const wall = new THREE.Mesh(geometry, material);
    
    return wall;
}



// Create flat-mounted handle
function createHandle() {
    const handle = new THREE.Group();
    
    // Base plate
    const basePlate = new THREE.Mesh(
        new THREE.BoxGeometry(
            dims.basePlateWidth,
            dims.basePlateHeight,
            dims.basePlateThickness,
            dims.basePlateDepth
        ),
        materials.steel
    );
    handle.add(basePlate);
    
    // Handle assembly
    const handleGroup = new THREE.Group();
    
    // Vertical supports
    const verticalGeometry = new THREE.CylinderGeometry(
        dims.handleTubeRadius,
        dims.handleTubeRadius,
        dims.handleHeight,
        16
    );
    
    const leftVertical = new THREE.Mesh(verticalGeometry, materials.darkSteel);
    leftVertical.position.set(-dims.handleWidth/2, 0, dims.handleDepth);
    handleGroup.add(leftVertical);
    
    const rightVertical = new THREE.Mesh(verticalGeometry, materials.darkSteel);
    rightVertical.position.set(dims.handleWidth/2, 0, dims.handleDepth);
    handleGroup.add(rightVertical);
    
    // Horizontal grip
    const horizontalGeometry = new THREE.CylinderGeometry(
        dims.handleTubeRadius,
        dims.handleTubeRadius,
        dims.handleWidth - dims.handleTubeRadius * 2,
        16
    );
    const horizontalHandle = new THREE.Mesh(horizontalGeometry, materials.darkSteel);
    horizontalHandle.rotation.z = Math.PI/2;
    horizontalHandle.position.set(0, dims.handleHeight/2, dims.handleDepth);
    handleGroup.add(horizontalHandle);
    
    // Rubber grip
    const rubberGeometry = new THREE.CylinderGeometry(
        dims.handleTubeRadius + dims.rubberThickness,
        dims.handleTubeRadius + dims.rubberThickness,
        dims.handleWidth - dims.handleTubeRadius * 4,
        16
    );
    const rubberGrip = new THREE.Mesh(rubberGeometry, materials.rubber);
    rubberGrip.rotation.z = Math.PI/2;
    rubberGrip.position.set(0, dims.handleHeight/2, dims.handleDepth);
    handleGroup.add(rubberGrip);
    
    // Center handle group
    handleGroup.position.y = dims.handleHeight/2;
    handle.add(handleGroup);
    
    // Mounting bolts
    const boltGeometry = new THREE.CylinderGeometry(4, 4, dims.basePlateThickness * 2, 6);
    const boltPositions = [
        [-dims.basePlateWidth/3, dims.basePlateHeight/3],
        [dims.basePlateWidth/3, dims.basePlateHeight/3],
        [-dims.basePlateWidth/3, -dims.basePlateHeight/3],
        [dims.basePlateWidth/3, -dims.basePlateHeight/3]
    ];
    
    boltPositions.forEach(([x, y]) => {
        const bolt = new THREE.Mesh(boltGeometry, materials.darkSteel);
        bolt.position.set(x, y, 0);
        bolt.rotation.x = Math.PI/2;
        handle.add(bolt);
    });
    
    return handle;
}

// Add stepped edges to box


function createSteppedEdge(length) {
   const shape = new THREE.Shape();
   const t = dims.thickness;
   const s = dims.stepInset;
   const h = dims.stepHeight;
   const bendR = 2.5;
   const hemLength = 15;

   // Main profile
   shape.moveTo(0, 0);
   shape.lineTo(0, t);
   shape.lineTo(s, s + t);
   shape.lineTo(s, s + h);
   shape.lineTo(0, s + h + s);
   shape.lineTo(0, s + h + s + h);

   // Add outward hem only if enabled
   if(config.enableHemming) {
       shape.lineTo(hemLength, s + h + s + h);
       shape.bezierCurveTo(
           hemLength + bendR, s + h + s + h,
           hemLength + bendR, s + h + s + h - bendR,
           hemLength, s + h + s + h - (2 * bendR)
       );
       shape.lineTo(0, s + h + s + h - (2 * bendR));
   }

   // Inner profile
   shape.lineTo(t, s + h + s + h - (config.enableHemming ? (2 * bendR) : 0));
   shape.lineTo(t, s + h + s);
   shape.lineTo(s - t, s + h);
   shape.lineTo(s - t, s);
   shape.lineTo(t, t);
   shape.lineTo(0, 0);

   const extrudeSettings = {
       steps: 1,
       depth: length,
       bevelEnabled: false
   };
   
   const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
   return new THREE.Mesh(geometry, materials.steel);
}

function addSteppedEdges(box) {
    const vertOffset = dims.stepHeight*2  - dims.stepInset * 2;  // Offset to align with top edge
    
    // Front edge (longer edge)
    const frontEdge = createSteppedEdge(dims.length);
    frontEdge.position.set(dims.length/2, dims.height + vertOffset, -dims.width/2 + dims.thickness/2);
    frontEdge.rotation.y = 6*Math.PI/4;
    box.add(frontEdge);
    
    // Back edge (longer edge)
    const backEdge = createSteppedEdge(dims.length);
    backEdge.position.set(-dims.length/2, dims.height + vertOffset, dims.width/2 - dims.thickness);
    backEdge.rotation.y = 10*Math.PI/4;
    box.add(backEdge);
    
    // Left edge (shorter edge)
    const leftEdge = createSteppedEdge(dims.width + dims.thickness * 2);
    leftEdge.position.set(dims.length/2 - dims.thickness, dims.height + vertOffset, dims.width/2);
    leftEdge.rotation.y = -Math.PI;
    box.add(leftEdge);
    
    // Right edge (shorter edge)
    const rightEdge = createSteppedEdge(dims.width + dims.thickness * 2);
    rightEdge.position.set(-dims.length/2 + dims.thickness, dims.height + vertOffset, -dims.width/2);
    rightEdge.rotation.y = 8*Math.PI/4;
    box.add(rightEdge);
}



// Modify createBox function to use config
function createBox() {
   const box = new THREE.Group();

   // Base
   const base = new THREE.Mesh(
       new THREE.BoxGeometry(dims.length, dims.thickness, dims.width),
       materials.steel
   );
   base.position.y = -dims.thickness/2;
   box.add(base);

   // Create walls
   const wallConfigs = [
       {
           width: dims.length,
           height: dims.height,
           position: [0, dims.height/2, dims.width/2],
           rotation: [0, 0, 0],
           isHandleSide: false
       },
       {
           width: dims.length,
           height: dims.height,
           position: [0, dims.height/2, -dims.width/2],
           rotation: [0, Math.PI, 0],
           isHandleSide: false
       },
       {
           width: dims.width,
           height: dims.height,
           position: [-dims.length/2, dims.height/2, 0],
           rotation: [0, -Math.PI/2, 0],
           isHandleSide: true
       },
       {
           width: dims.width,
           height: dims.height,
           position: [dims.length/2, dims.height/2, 0],
           rotation: [0, Math.PI/2, 0],
           isHandleSide: true
       }
   ];

   wallConfigs.forEach(({ width, height, position, rotation, isHandleSide }) => {
       // Create either perforated or plain wall based on config
       const wall = config.enablePerforation ? 
           createPerforatedWall(width, height, isHandleSide) :
           new THREE.Mesh(
               new THREE.PlaneGeometry(width, height),
               materials.steel
           );
       
       wall.position.set(...position);
       wall.rotation.set(...rotation);
       box.add(wall);
   });

   
  addSteppedEdges(box);
   return box;
}

// Initialize scene
const { scene, camera, renderer } = initScene();
const controls = new OrbitControls(camera, renderer.domElement);

// Create and add box
const box = createBox();
scene.add(box);
addHandles(scene, box);


// Add handles
function addHandles(scene, box) {
   if (!config.enableHandles) return;

   const leftHandle = createHandle();
   leftHandle.position.set(-dims.length/2, dims.height/2, 0);
   leftHandle.rotation.y = Math.PI/2;
   leftHandle.rotation.x = Math.PI;
   scene.add(leftHandle);

   const rightHandle = createHandle();
   rightHandle.position.set(dims.length/2, dims.height/2, 0);
   rightHandle.rotation.y = -Math.PI/2;
   rightHandle.rotation.x = Math.PI;
   scene.add(rightHandle);
}

// Add lights
function addLights() {
   // Bright ambient light
   const ambient = new THREE.AmbientLight(0xffffff, 1.2);
   scene.add(ambient);
   
   // Brighter main directional light
   const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
   mainLight.position.set(500, 500, 500);
   mainLight.castShadow = true;
   scene.add(mainLight);
   
   // Additional bright point lights
   const lights = [
       { position: [-200, 200, 200], intensity: 1.0 },
       { position: [200, 200, -200], intensity: 1.0 },
       { position: [0, 800, 0], intensity: 0.8 },
       { position: [0, -500, 0], intensity: 0.8 }
   ];
   
   lights.forEach(({ position, intensity }) => {
       const light = new THREE.PointLight(0xffffff, intensity);
       light.position.set(...position);
       scene.add(light);
   });
}

addLights();

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
};

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);
