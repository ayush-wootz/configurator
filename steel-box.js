import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.localClippingEnabled = true;

// Define rubber color options
const RUBBER_COLORS = {
  black: '0x111111',
  blue: '0x0047AB', // Cobalt Blue
  steel: '0xC0C0C0', // Steel Grey
};


let clippingPlane1, clippingPlane2, clippingPlane3, clippingPlane4;

function getURLParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    length: parseInt(urlParams.get('len')) || 200,
    width: parseInt(urlParams.get('wid')) || 200,
    height: parseInt(urlParams.get('hei')) || 200,
    enableHandles: urlParams.get('handle') === 'true' || false,
    enablePerforation: urlParams.get('perf') === 'true' || false,
    enableWheels: urlParams.get('wheel') === 'true' || false,
    enableRibs: urlParams.get('ribs') === 'true' || false,
    enableStraightTop: urlParams.get('straight') === 'true' || true,
    enableRubberLining: urlParams.get('rubber') === 'true' || false,
    rubberColor: RUBBER_COLORS[urlParams.get('rubberColor') || 'blue'],
    rubberThickness: parseInt(urlParams.get('rubberThick')) || 2,
    rubberHeight: parseInt(urlParams.get('rubberHeight')) || 5,
    rubberOverhang: parseInt(urlParams.get('rubberOverhang')) || 0,
    materialType: urlParams.get('material') || 'steel', // aluminium, steel, mildSteel, darkSteel
    enableLid: urlParams.get('lid') === 'true' || true,
    enableLock: urlParams.get('lock') === 'true' || true,
  };
}

const params = getURLParameters();

// Configuration object
const config = {
  enableHandles: params.enableHandles,
  enablePerforation: params.enablePerforation,
  enableWheels: params.enableWheels,
  enableRibs: params.enableRibs,
  enableStraightTop: params.enableStraightTop,
  enableRubberLining: params.enableRubberLining, // Add this line
  enableLid: params.enableLid, // Add this line
  enableLock: params.enableLock,
};

const step_dims = {
  stepHeight: 5,
  stepInset: 5,
};

// Setting up the Box dimensions
const dims = {
  length: params.length,
  width: params.width,
  height:
    params.height +
    (config.enableStraightTop
      ? step_dims.stepHeight * 2 + step_dims.stepInset * 2
      : 0),
  thickness: 2,
  wheelDiameter: 42,
  wheelThickness: 10,
  wheelOffset: 30,
};

// Dynamic handle dimensions
dims.basePlateWidth = Math.min(dims.width * 0.6, 130);
dims.basePlateHeight = Math.min(dims.width * 0.45, 95);
dims.basePlateThickness = Math.max(dims.width * 0.015, 3);
dims.basePlateDepth = -Math.max(dims.width * 0.05, 10);
dims.handleWidth = dims.basePlateWidth * 0.75;
dims.handleHeight = dims.basePlateHeight * 0.4;
dims.handleTubeRadius = Math.max(dims.width * 0.015, 3);
dims.handleDepth = dims.basePlateDepth;
dims.rubberThickness = Math.max(dims.width * 0.005, 1);
dims.basePlateYposition = -dims.height / 2 + dims.height * 0.3;

// Add rib parameters
dims.ribDepth = 4;
dims.ribWidth = 16;
dims.ribInterval = 200;

// Add rubber lining parameters
dims.rubberLining = {
  thickness: params.rubberThickness,
  height: params.rubberHeight,
  overhang: params.rubberOverhang,
  verticalOffset: config.enableStraightTop
    ? 0
    : step_dims.stepHeight * 2 + step_dims.stepInset * 2, // 32mm fixed offset from top
};

// Materials
const materials = {
  steel: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.6,
    reflectivity: 0.8,
    clearcoat: 0.1,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  }),
  mildSteel: new THREE.MeshStandardMaterial({
    color: 0x6e6e6e,
    metalness: 1.0,
    roughness: 0.4,
    reflectivity: 0.6,
    clearcoat: 0.1,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  }),
  darkSteel: new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.85,
    roughness: 0.35,
    reflectivity: 0.7,
    clearcoat: 0.1,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  }),
  rubber: new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.9,
    side: THREE.DoubleSide,
  }),
  fibreglass: new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.2, 
    roughness: 0.8,
    side: THREE.DoubleSide,
  }),
  wheelRubber: new THREE.MeshStandardMaterial({
    color: 0x101010,
    metalness: 0.0,
    roughness: 0.9,
    side: THREE.DoubleSide,
  }),

  aluminium: new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,      // Off-white
    metalness: 0.6,       // Moderate metallic feel
    roughness: 0.3,       // Smoother than matte
    reflectivity: 0.5,    // Moderate reflectivity
    clearcoat: 0.5,       // Medium gloss layer
    clearcoatRoughness: 0.2, // Smooth clear coat
    transmission: 0.0,    // Opaque
    side: THREE.DoubleSide,
    envMapIntensity: 0.7, // More interaction with environment
    sheen: 0.2,           // Soft diffuse sheen
    sheenRoughness: 0.3,  // Slightly glossy feel
    ior: 1.48,           // Similar to aluminum
    specularIntensity: 0.7
  }),
};

// Initialize scene
function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xE4E4E4);

  
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );
  
  camera.position.set(500, 500, 500).multiplyScalar(1.5); // Zoom out further
  camera.lookAt(0, 0, 0); // Explicitly look at scene center

  const renderer = new THREE.WebGLRenderer({ antialias: true, toneMapping: THREE.ACESFilmicToneMapping });
  // renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true; // Enable clipping system

 // Initialize controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.dampingFactor = 0.05;
  controls.minDistance = 100;   
  controls.maxDistance = 4000;  
  controls.maxPolarAngle = Math.PI / 1.5;   

  

  // Initialize clipping planes with normalized normals
  const diagonalAngle1 = Math.atan2(dims.width, dims.length);
  const diagonalAngle2 = Math.PI / 2 - diagonalAngle1;
  clippingPlane1 = new THREE.Plane(
    new THREE.Vector3(
      Math.cos(-diagonalAngle2),
      0,
      Math.sin(-diagonalAngle2)
    ).normalize(),
    0
  );

  clippingPlane2 = new THREE.Plane(
    new THREE.Vector3(Math.cos(diagonalAngle2), 0, Math.sin(diagonalAngle2)),
    1
  );
  clippingPlane3 = new THREE.Plane(
    new THREE.Vector3(Math.cos(-diagonalAngle2), 0, Math.sin(-diagonalAngle2)),
    1
  );
  clippingPlane3.normal.negate();
  clippingPlane4 = new THREE.Plane(
    new THREE.Vector3(Math.cos(diagonalAngle2), 0, Math.sin(diagonalAngle2)),
    1
  );
  clippingPlane4.normal.negate();

  document.body.appendChild(renderer.domElement);
  let globalRenderer = renderer;

  return { scene, camera, renderer, controls };
}

// LID & LOCK ASSEMBY
function getLidYPosition() {
    if (config.enableStraightTop) {
      // The height already includes the extra offset for a straight top
      return dims.height; 
    } else {
      // For stepped edges, dims.height is the base box height,
      // and the stepped edges also end at dims.height (given the current code).
      // If you want the lid exactly flush, return dims.height.
      // If you prefer a tiny gap or an extra offset, add it below:
      const vertOffset = step_dims.stepHeight * 2 + step_dims.stepInset * 2;
      // Often vertOffset = 0 if stepHeight and stepInset match, 
      // but you can add a small constant if desired (e.g., + 1 or + 2).
      return  dims.height + vertOffset; 
    }
  }
  /**
   * Create a 3D lid that covers the top of the box.
   * - It has a top panel plus downward flanges (lips) around each edge.
   * - Automatically adjusts minor dimensions if "stepped top" is disabled or enabled.
   * - Returns a THREE.Group containing all lid parts.
   */
  
  function createBoxLid() {
    const lidGroup = new THREE.Group();
  
    const lidThickness = 2;
    const flangeHeight = 5;
    const baseOverhang = config.enableStraightTop ? 2 : 2;
  
    const topPanelLength = dims.length + baseOverhang * 2;
    const topPanelWidth  = dims.width  + baseOverhang * 2;
  
    // Main lid panel
    const topPanelGeom = new THREE.BoxGeometry(
      topPanelLength,
      lidThickness,
      topPanelWidth
    );
    const topPanelMesh = new THREE.Mesh(
      topPanelGeom,
      materials[params.materialType]
    );
    topPanelMesh.position.y = lidThickness / 2;
    lidGroup.add(topPanelMesh);
  
    // Flange creation helper
    function createFlange(flangeWidth, flangeDepth) {
      const flangeGeom = new THREE.BoxGeometry(flangeWidth, flangeHeight, flangeDepth);
      return new THREE.Mesh(flangeGeom, materials[params.materialType]);
    }
  
    const flangeThickness = 2;
  
    // Front flange
    const frontFlange = createFlange(topPanelLength, flangeThickness);
    frontFlange.position.set(
      0,
      -flangeHeight / 2, 
      (topPanelWidth / 2.04) + (flangeThickness / 2)
    );
    lidGroup.add(frontFlange);
  
    // Back flange
    const backFlange = createFlange(topPanelLength, flangeThickness);
    backFlange.position.set(
      0,
      -flangeHeight / 2,
      -(topPanelWidth / 2.04) - (flangeThickness / 2)
    );
    lidGroup.add(backFlange);
  
    // Left flange
    const leftFlange = createFlange(flangeThickness, topPanelWidth);
    leftFlange.position.set(
      -(topPanelLength / 2.04) - (flangeThickness / 2),
      -flangeHeight / 2,
      0
    );
    lidGroup.add(leftFlange);
  
    // Right flange
    const rightFlange = createFlange(flangeThickness, topPanelWidth);
    rightFlange.position.set(
      (topPanelLength / 2.04) + (flangeThickness / 2),
      -flangeHeight / 2,
      0
    );
    lidGroup.add(rightFlange);
  
    enableShadows(lidGroup); 
    return lidGroup;
  }
  
  function positionLidForHinge(lid) {
    const baseOverhang = config.enableStraightTop ? 2 : 5;
    const topPanelWidth = dims.width + baseOverhang * 2;
    lid.position.z = topPanelWidth / 2;
  }
  
  // Box Lock - Catch & Tab
   // Creating Smooth Edge Geometry
  function createRoundedRectGeometry(width, height, roundness, depth) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    
    // Start at the bottom left corner (shifted by roundness)
    shape.moveTo(x + roundness, y);
    // Bottom edge
    shape.lineTo(x + width - roundness, y);
    // Bottom-right corner
    shape.quadraticCurveTo(x + width, y, x + width, y + roundness);
    // Right edge
    shape.lineTo(x + width, y + height - roundness);
    // Top-right corner
    shape.quadraticCurveTo(x + width, y + height, x + width - roundness, y + height);
    // Top edge
    shape.lineTo(x + roundness, y + height);
    // Top-left corner
    shape.quadraticCurveTo(x, y + height, x, y + height - roundness);
    // Left edge
    shape.lineTo(x, y + roundness);
    // Bottom-left corner
    shape.quadraticCurveTo(x, y, x + roundness, y);
    
    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: roundness * 0.5,
      bevelSize: roundness,
      bevelSegments: 3
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }
  
   // Adding the Catch & Tab
  function addLock(scene, box, lidGroup) {
    // Only add the locks if enabled
    if (!params.enableLock) return;
  
    // --- Lock geometry sizes (same for both locks) ---
    // Catch (on the box front)
    // Derive dimensions from box dimensions using ratios:
    const catchWidth  = dims.length * 0.06;  // 6% of box length
    const catchHeight = dims.height * 0.08;   // 8% of box height
    const catchDepth  = dims.width  * 0.025;   // 2.5% of box width
    const catchRoundness = 2;  // adjust for more or less rounding
    
    // Tab (on the lid front)
    const tabWidth  = dims.length * 0.05;      // 5% of box length
    const tabHeight = dims.height * 0.09;       // 9% of box height
    const tabDepth  = dims.width  * 0.0233;      // ~2.33% of box width
    const tabRoundness = 2; //for rounding
  
    // We'll place the locks at ±(0.3 * dims.length) in X
    const xOffsets = [dims.length * 0.3, -dims.length * 0.3];
  
    // The box front is at z = + (dims.width / 2)
    // The lid's front edge is at about topPanelWidth/2, from createBoxLid code
    const baseOverhang = config.enableStraightTop ? 2 : 2; 
    const topPanelWidth = dims.width + baseOverhang * 2;
    const frontEdgeZ = topPanelWidth / 2;
  
    // Material
    const lockMaterial = materials[params.materialType];
  
    // For each xOffset, build one “catch” + “tab”
    xOffsets.forEach((xOffset) => {
      // --- 1) Catch (on the box) --- THREE.BoxGeometry(catchWidth, catchHeight, catchDepth)
      const catchGeom = new createRoundedRectGeometry(catchWidth, catchHeight, catchRoundness, catchDepth);
      const catchMesh = new THREE.Mesh(catchGeom, lockMaterial);
  
      // Position:
      //   x = ±(0.3 * dims.length)
      //   y = near top => dims.height minus half the catch
      //   z = front face => + (dims.width / 2) plus half the catch depth + a small nudge
      catchMesh.position.set(
        xOffset,
        dims.height - catchHeight,
        dims.width / 2 + catchDepth / 2 + 1
      );
      box.add(catchMesh);
  
      // --- 2) Tab (on the lid) --- THREE.BoxGeometry(tabWidth, tabHeight, tabDepth)
      const tabGeom = new createRoundedRectGeometry(tabWidth, tabHeight, tabRoundness, tabDepth);
      const tabMesh = new THREE.Mesh(tabGeom, lockMaterial);
  
      // Position in the lid’s local space:
      //   x = ±(0.3 * dims.length)
      //   y = so it lines up near top (the lid’s local Y=0 is the top panel)
      //   z = frontEdgeZ + half the tab thickness, so it protrudes
      tabMesh.position.set(
        xOffset,
        -tabHeight / 2,
        frontEdgeZ + tabDepth / 2
      );
      lidGroup.add(tabMesh);
    });
  }
  
  
  
  // BoxLid Support Rods
  function createRubberStrap({
    strapWidth = 10,     // width of the strap (thickness in the 2D plane)
    segment1Length = 40, // how long the first segment (parallel to wall) is
    diagonalX = 30,      // horizontal offset for the diagonal part
    diagonalY = 30,      // vertical offset for the diagonal part
    strapThickness = 2,  // how "thick" the strap is in the extrusion direction
    color = 0x111111,    // near-black rubber color
  } = {}) {
    // Define a 2D "L" shape in the XY plane
    //   Segment 1: runs up from (0,0) to (0, segment1Length)
    //   Segment 2: angled from that point to (diagonalX, diagonalY)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(strapWidth, 0);
    shape.lineTo(strapWidth, segment1Length);
    shape.lineTo(strapWidth + diagonalX, segment1Length + diagonalY);
    shape.lineTo(0 + diagonalX, segment1Length + diagonalY);
    shape.lineTo(0, segment1Length);
    shape.closePath();
  
    const extrudeSettings = {
      depth: strapThickness,
      bevelEnabled: false,
      steps: 1,
    };
  
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
    // Rubber-like material
    const strapMaterial = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.0,
      roughness: 0.95,
      side: THREE.DoubleSide,
    });
  
    const strapMesh = new THREE.Mesh(geometry, strapMaterial);
    // Optionally enable shadow casting/receiving:
    strapMesh.castShadow = true;
    strapMesh.receiveShadow = true;
  
    return strapMesh;
  }
  
  function addRubberStrap(scene, box, lid) {
    // 1) Create the strap
    const strap = createRubberStrap({
      strapWidth: 8,
      segment1Length: 40,
      diagonalX: 15,
      diagonalY: 14,
      strapThickness: 2,
      color: 0x222222, // dark rubber
    });
  
    // 2) Position it so the bottom anchor is near the box’s top edge.
    //    Suppose we attach it to the left side, near the back:
    strap.position.set(
      -dims.length / 2 + 10, // left side offset
      dims.height - 10,      // slightly below the box top
      -dims.width / 2 + 3   // near the back edge
    );
  
    // 3) Rotate so it lines up with the box wall and the lid
    //    This is just an example guess:
    //    - rotate around Y so the strap is oriented inward
    strap.rotation.y = THREE.MathUtils.degToRad(5);
    //    - maybe rotate around X a bit so it lines up with the angled lid
    strap.rotation.x = THREE.MathUtils.degToRad(5);
  
    // 4) Add to the scene
    scene.add(strap);
  
    // If you want a second strap on the other side, just clone or create another.
    // For example:
    const strapRight = strap.clone();
    strapRight.position.x = dims.length / 2 - 20;  // move to right side
    strapRight.rotation.y = THREE.MathUtils.degToRad(-5); // mirror the Y rotation
    scene.add(strapRight);
  }
  

// Create rubber material with configurable color
function createRubberMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color: parseInt(color),
    metalness: 0.0,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
}

function createTopRubberLining(width) {
  const shape = new THREE.Shape();
  const t = dims.rubberLining.thickness;
  const h = dims.rubberLining.height;
  const o = dims.rubberLining.overhang;

  // Create profile ensuring symmetry
  shape.moveTo(-o, -t / 2);
  shape.lineTo(-o, h - t / 2);
  shape.lineTo(width + o, h - t / 2);
  shape.lineTo(width + o, -t / 2);
  shape.lineTo(width, -t / 2);
  shape.lineTo(0, -t / 2);
  shape.lineTo(-o, -t / 2);

  const extrudeSettings = {
    steps: 1,
    depth: t,
    bevelEnabled: true,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const rubberMaterial = new THREE.MeshStandardMaterial({
    color: parseInt(params.rubberColor),
    metalness: 0.0,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, rubberMaterial);
}

function addTopRubberLining(box) {
  const vertOffset = dims.height + dims.rubberLining.verticalOffset;

  const liningConfigs = [
    // Front wall
    {
      width: dims.length,
      position: [
        -dims.length / 2,
        vertOffset,
        dims.width / 2 - dims.thickness / 2,
      ],
      rotation: [0, 0, 0],
    },
    // Back wall
    {
      width: dims.length,
      position: [
        -dims.length / 2,
        vertOffset,
        -dims.width / 2 - dims.thickness / 2,
      ],
      rotation: [0, 0, 0],
    },
    // Left wall
    {
      width: dims.width,
      position: [
        -dims.length / 2 - dims.thickness / 66,
        vertOffset,
        dims.width / 2,
      ],
      rotation: [0, Math.PI / 2, 0],
    },
    // Right wall
    {
      width: dims.width,
      position: [
        dims.length / 2 - dims.thickness / 1.03,
        vertOffset,
        dims.width / 2,
      ],
      rotation: [0, Math.PI / 2, 0],
    },
  ];

  liningConfigs.forEach(config => {
    const lining = createTopRubberLining(config.width);
    lining.position.set(...config.position);
    lining.rotation.set(...config.rotation);
    box.add(lining);
  });
}


// Function to draw the integrated handle directly on canvas
function drawIntegratedHandle(ctx, x, y, scale) {
  const handleWidth = dims.basePlateWidth * 0.8 * scale; // Slightly smaller than base plate
  const handleHeight = dims.basePlateHeight * 0.3 * scale; // Thinner than base plate
  const cornerRadius = handleHeight / 2; // Rounded ends

  ctx.beginPath();

  // Start from the left edge
  ctx.moveTo(x - handleWidth / 2 + cornerRadius, y - handleHeight / 2);

  // Draw bottom line
  ctx.lineTo(x + handleWidth / 2 - cornerRadius, y - handleHeight / 2);

  // Draw right arc
  ctx.arc(
    x + handleWidth / 2 - cornerRadius,
    y,
    cornerRadius,
    Math.PI * 1.5,
    Math.PI * 0.5,
    false
  );

  // Draw top line
  ctx.lineTo(x - handleWidth / 2 + cornerRadius, y + handleHeight / 2);

  // Draw left arc
  ctx.arc(
    x - handleWidth / 2 + cornerRadius,
    y,
    cornerRadius,
    Math.PI * 0.5,
    Math.PI * 1.5,
    false
  );

  ctx.closePath();
  ctx.fill();
}

// Add this function to create the rim
function createHandleRim(width, height, isHandleSide = false) {
  if (!isHandleSide || config.enableHandles) return null;

  const handleWidth = dims.basePlateWidth * 0.8;
  const handleHeight = dims.basePlateHeight * 0.3;
  const cornerRadius = handleHeight / 2;
  const rimThickness = 4; // Thickness of the rim
  const rimDepth = 6; // Height/depth of the rim

  // Create shape for the rim
  const shape = new THREE.Shape();

  // Draw the rim shape similar to the handle hole but slightly larger
  shape.moveTo(
    -handleWidth / 2 - rimThickness + cornerRadius,
    -handleHeight / 2 - rimThickness
  );
  shape.lineTo(
    handleWidth / 2 + rimThickness - cornerRadius,
    -handleHeight / 2 - rimThickness
  );
  shape.arc(
    0,
    cornerRadius + rimThickness,
    cornerRadius + rimThickness,
    Math.PI * 1.5,
    Math.PI * 0.5,
    false
  );
  shape.lineTo(
    -handleWidth / 2 - rimThickness + cornerRadius,
    handleHeight / 2 + rimThickness
  );
  shape.arc(
    0,
    -(cornerRadius + rimThickness),
    cornerRadius + rimThickness,
    Math.PI * 0.5,
    Math.PI * 1.5,
    false
  );

  // Create inner hole matching the handle cutout
  const hole = new THREE.Path();
  hole.moveTo(-handleWidth / 2 + cornerRadius, -handleHeight / 2);
  hole.lineTo(handleWidth / 2 - cornerRadius, -handleHeight / 2);
  hole.arc(0, cornerRadius, cornerRadius, Math.PI * 1.5, Math.PI * 0.5, false);
  hole.lineTo(-handleWidth / 2 + cornerRadius, handleHeight / 2);
  hole.arc(0, -cornerRadius, cornerRadius, Math.PI * 0.5, Math.PI * 1.5, false);

  shape.holes.push(hole);

  // Extrude settings for the rim
  const extrudeSettings = {
    depth: rimDepth,
    bevelEnabled: true,
    bevelThickness: 2,
    bevelSize: 1,
    bevelOffset: 0,
    bevelSegments: 3,
  };

  const rimGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const rim = new THREE.Mesh(rimGeometry, materials[params.materialType]);

  return rim;
}

// // Modified perforated wall creation to include integrated handle
// Keep drawIntegratedHandle and createHandleRim functions exactly as they are

function createPerforatedWall(width, height, isHandleSide = true) {
  // Create a group to hold both wall and rim
  const wallGroup = new THREE.Group();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const scale = 10;
  canvas.width = width * scale;
  canvas.height = height * scale;

  // Background
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const holeRadius = 1.5 * scale;
  const holePitch = 12 * scale;
  const margin = holePitch;

  // Handle area dimensions
  const handlePlateWidth = dims.basePlateWidth * scale;
  const handlePlateHeight = dims.basePlateHeight * scale;

  // Calculate rows and columns for holes
  const rows = Math.floor((height * scale - 2 * margin) / holePitch);
  const cols = Math.floor((width * scale - 2 * margin) / holePitch);

  // Draw perforation holes
  ctx.fillStyle = 'black';
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = margin + j * holePitch + holePitch / 2;
      const y = margin + i * holePitch + holePitch / 2;

      if (isHandleSide) {
        const handleCenterY = canvas.height * 0.3;
        const handleCenterX = canvas.width / 2;

        // Skip holes in handle area based on configuration
        if (config.enableHandles) {
          // Skip holes where the base plate would be
          const inHandleArea =
            Math.abs(x - handleCenterX) < handlePlateWidth / 2 &&
            Math.abs(y - handleCenterY) < handlePlateHeight / 2;
          if (inHandleArea) continue;
        } else {
          // Skip holes where the integrated handle would be
          const inIntegratedHandleArea =
            Math.abs(x - handleCenterX) < (handlePlateWidth * 0.8) / 2 &&
            Math.abs(y - handleCenterY) < (handlePlateHeight * 0.3) / 2;
          if (inIntegratedHandleArea) continue;
        }
      }

      ctx.beginPath();
      ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Create handle cutout if needed
  if (!config.enableHandles && isHandleSide) {
    const handleCenterY = canvas.height * 0.3;
    const handleCenterX = canvas.width / 2;

    ctx.globalCompositeOperation = 'destination-out';
    drawIntegratedHandle(ctx, handleCenterX, handleCenterY, scale);
    ctx.globalCompositeOperation = 'source-over';
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Clone the user-selected material and add our texture
  const material = materials[params.materialType].clone();
  material.map = texture;
  material.alphaTest = 0.5;
  material.transparent = true;

  // Create wall mesh and add to group
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  wallGroup.add(wall);

  // Add rim if needed
  if (!config.enableHandles && isHandleSide) {
    const rim = createHandleRim(width, height, isHandleSide);
    if (rim) {
      const handleYOffset = -height * 0.3 + height / 2;
      rim.position.set(0, handleYOffset, 1);
      rim.rotation.x = Math.PI;
      wallGroup.add(rim);
    }
  }

  return wallGroup;
}


function createWallWithHandle(width, height, isHandleSide) {
    const wallGroup = new THREE.Group();
    
    // Create base wall with or without perforation
    const wall = config.enablePerforation ? 
        createPerforatedWall(width, height, isHandleSide) :
        new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            materials[params.materialType]
        );
    
    wallGroup.add(wall);
    
    // Add integrated handle if needed (independent of perforation)
    if (!config.enableHandles && isHandleSide) {
        // Add handle cutout to the wall
        const handleTexture = createHandleCutoutTexture(width, height);
        
        // Clone and modify the wall's material to include the cutout
        const wallMaterial = materials[params.materialType].clone();
        wallMaterial.alphaMap = handleTexture;
        wallMaterial.transparent = true;
        wallMaterial.alphaTest = 0.5;
        wall.material = wallMaterial;
        
        // Add the rim
        const rim = createHandleRim(width, height, isHandleSide);
        if (rim) {
            const handleYOffset = height * 0.3 - height/2;
            rim.position.set(0, -handleYOffset, 1);
            rim.rotation.x = Math.PI;
            wallGroup.add(rim);
        }
    }
    
    return wallGroup;
}

// Helper function to create handle cutout texture
function createHandleCutoutTexture(width, height) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = 10;
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    // Make everything opaque (white)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create transparent cutout for handle
    ctx.globalCompositeOperation = 'destination-out';
    const handleCenterY = canvas.height * 0.3;
    const handleCenterX = canvas.width/2;
    drawIntegratedHandle(ctx, handleCenterX, handleCenterY, scale);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}


// Create wheel components
function createWheelSpokes() {
  const spokes = new THREE.Group();
  const spokeCount = 6;
  const spokeWidth = 4;
  const radius = dims.wheelDiameter / 2 - 5;

  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(radius, 2, spokeWidth),
      materials.fibreglass
    );
    spoke.position.x = radius / 2;
    spoke.rotation.y = angle;
    spokes.add(spoke);
  }
  return spokes;
}

function createCastorWheel() {
  const wheel = new THREE.Group();

  const wheelCore = new THREE.CylinderGeometry(
    dims.wheelDiameter / 2 - 5,
    dims.wheelDiameter / 2 - 5,
    dims.wheelThickness,
    24
  );
  const wheelCoreMesh = new THREE.Mesh(wheelCore, materials.fibreglass);
  wheelCoreMesh.rotation.z = Math.PI / 2;

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(
      dims.wheelDiameter / 2,
      dims.wheelDiameter / 2,
      dims.wheelThickness,
      24
    ),
    materials.wheelRubber
  );
  tire.rotation.z = Math.PI / 2;

  const spokes = createWheelSpokes();
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, dims.wheelThickness + 2, 16),
    materials.steel
  );
  hub.rotation.z = Math.PI / 2;

  const wheelAssembly = new THREE.Group();
  wheelAssembly.add(wheelCoreMesh, tire, spokes, hub);

  const bracket = new THREE.Group();
  const forkGeometry = new THREE.BoxGeometry(dims.wheelThickness + 5, 20, 5);
  const forkLeft = new THREE.Mesh(forkGeometry, materials.steel);
  const forkRight = new THREE.Mesh(forkGeometry, materials.steel);

  forkLeft.position.set(-(dims.wheelThickness / 2 + 2.5), 10, 0);
  forkRight.position.set(dims.wheelThickness / 2 + 2.5, 10, 0);

  const plateGeometry = new THREE.BoxGeometry(40, 3, 40);
  const plate = new THREE.Mesh(plateGeometry, materials[params.materialType]);
  plate.position.y = 19.5;

  bracket.add(forkLeft, forkRight, plate);
  wheel.add(wheelAssembly, bracket);

  return wheel;
}


// Add these functions before createBox
function calculateRibPositions(totalHeight) {
  const numRibs = Math.floor(totalHeight / dims.ribInterval);
  if (numRibs === 0) return [];

  const positions = [];
  const interval = totalHeight / (numRibs + 1);

  for (let i = 1; i <= numRibs; i++) {
    positions.push(interval * i);
  }

  return positions;
}

function isInBasePlateArea(height) {
  const handleCenterY = dims.height / 2 - dims.basePlateYposition;

  // If handles are enabled, use base plate dimensions
  if (config.enableHandles) {
    const totalBasePlateArea = dims.basePlateHeight;
    return Math.abs(height - handleCenterY) < totalBasePlateArea / 2;
  }
  // For integrated handle, use rim dimensions
  else {
    const rimHeight = dims.basePlateHeight * 0.3; // Same as integrated handle height
    const rimThickness = 4; // Same as rim thickness
    const totalRimArea = rimHeight + rimThickness * 2; // Include rim thickness
    return Math.abs(height - handleCenterY) < totalRimArea / 2;
  }
}

function createRibSegment(width, startPos = 0, segmentWidth = null) {
  const points = [];
  const segments = 30; // Reduce from 100
  const ribDepth = dims.ribDepth ;
  const ribWidth = dims.ribWidth ;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI;
    let x = Math.sin(angle) * ribDepth;
    let y = (t - 0.5) * ribWidth;
    points.push(new THREE.Vector2(x, y));
  }

  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  points.forEach(point => shape.lineTo(point.x, point.y));

  const extrudeSettings = {
    steps: 1,
    depth: segmentWidth || width,
    bevelEnabled: false,
    bevelThickness: 0.3,
    bevelSize: 0.3,
    bevelSegments: 3,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mesh = new THREE.Mesh(geometry, materials[params.materialType]);

  if (startPos !== 0) {
    mesh.position.x = startPos;
  }

  return mesh;
}

function createSteppedEdge(length, material) {
  const shape = new THREE.Shape();
  const t = dims.thickness;
  const s = step_dims.stepInset;
  const h = step_dims.stepHeight;
  // Main profile
  shape.moveTo(0, 0);
  shape.lineTo(0, t);
  shape.lineTo(s, s + t);
  shape.lineTo(s, s + h);
  shape.lineTo(0, s + h + s);
  shape.lineTo(0, s + h + s + h);
  // Inner profile
  shape.lineTo(t, s + h + s + h);
  shape.lineTo(t, s + h + s);
  shape.lineTo(s - t, s + h);
  shape.lineTo(s - t, s);
  shape.lineTo(t, t);
  shape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 1,
    depth: length,
    bevelEnabled: true,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  return new THREE.Mesh(geometry, material);
}

function addSteppedEdges(box) {
  if (config.enableStraightTop) return;

  const vertOffset = step_dims.stepHeight * 2 - step_dims.stepInset * 2;
  const edgeGap = 0;

  const edges = [
    {
      dim: dims.width - edgeGap,
      pos: [
        -dims.length / 2 + edgeGap,
        dims.height + vertOffset,
        -dims.width / 2 + edgeGap,
      ],
      rotY: 0,
      materialType: params.materialType, // Store material type instead of direct reference
      clippingPlanes: [clippingPlane4, clippingPlane3],
    },
    {
      dim: dims.length - 2,
      pos: [
        -dims.length / 2 + edgeGap,
        dims.height + vertOffset,
        dims.width / 2 - edgeGap,
      ],
      rotY: Math.PI / 2,
      materialType: params.materialType,
      clippingPlanes: [clippingPlane2, clippingPlane3],
    },
    {
      dim: dims.width - edgeGap,
      pos: [
        dims.length / 2 - edgeGap,
        dims.height + vertOffset,
        dims.width / 2 - edgeGap,
      ],
      rotY: Math.PI,
      materialType: params.materialType,
      clippingPlanes: [clippingPlane1, clippingPlane2],
    },
    {
      dim: dims.length - 2,
      pos: [
        dims.length / 2 - edgeGap,
        dims.height + vertOffset,
        -dims.width / 2 + edgeGap,
      ],
      rotY: -Math.PI / 2,
      materialType: params.materialType,
      clippingPlanes: [clippingPlane1, clippingPlane4],
    },
  ];
  edges.forEach(({ dim, pos, rotY, materialType, clippingPlanes }) => {
    // Clone the material to avoid shared instances
    const edgeMaterial = materials[params.materialType].clone();
    edgeMaterial.clippingPlanes = clippingPlanes; // Assign clipping planes

    const edge = createSteppedEdge(dim, edgeMaterial);
    edge.position.set(...pos);
    edge.rotation.y = rotY;
    box.add(edge);
  });
}

function addRibs(box) {
  const ribPositions = calculateRibPositions(dims.height);

  const wallConfigs = [
    {
      width: dims.length + 0.5,
      position: [dims.length / 2, 0, dims.width / 2 + dims.thickness / 2],
      rotation: [0, -Math.PI / 2, 0],
      hasBasePlate: false,
      shiftAxis: 'z',
    },
    {
      width: dims.length + 0.5,
      position: [-dims.length / 1.99, 0, -dims.width / 2 - dims.thickness / 2],
      rotation: [0, Math.PI / 2, 0],
      hasBasePlate: false,
      shiftAxis: 'z',
    },
    {
      width: dims.width + 0.5,
      position: [
        -dims.length / 2 - dims.thickness / 2,
        dims.length / 2,
        dims.width / 1.98,
      ],
      rotation: [0, -Math.PI, 0],
      hasBasePlate: true,
      shiftAxis: 'x',
    },
    {
      width: dims.width + 0.5,
      position: [dims.length / 2, -dims.width, dims.width / 1.99],
      rotation: [0, Math.PI, -Math.PI],
      hasBasePlate: true,
      shiftAxis: 'x',
    },
  ];

  ribPositions.forEach(height => {
    wallConfigs.forEach(config => {
      if (config.hasBasePlate && isInBasePlateArea(height)) {
        const indentWidth = dims.basePlateWidth;
        const indentStartPos = (config.width - indentWidth) / 2;
        const remainingWidth = (config.width - indentWidth) / 2;

        if (remainingWidth > 0) {
          const beforeSegment = createRibSegment(
            config.width,
            0,
            remainingWidth
          );
          beforeSegment.position.set(...config.position);
          beforeSegment.position.y = height;
          beforeSegment.rotation.set(...config.rotation);
          box.add(beforeSegment);

          const afterSegment = createRibSegment(
            config.width,
            0,
            remainingWidth
          );
          const afterPosition = [...config.position];

          const shiftAmount = indentStartPos + indentWidth;
          if (config.shiftAxis === 'x') {
            afterPosition[2] -= shiftAmount + 1;
          } else {
            afterPosition[0] += shiftAmount;
          }

          afterSegment.position.set(...afterPosition);
          afterSegment.position.y = height;
          afterSegment.rotation.set(...config.rotation);
          box.add(afterSegment);
        }
      } else {
        const rib = createRibSegment(config.width);
        rib.position.set(...config.position);
        rib.position.y = height;
        rib.rotation.set(...config.rotation);
        box.add(rib);
      }
    });
  });
}

// Create handle
function createHandle() {
  const handle = new THREE.Group();

  const basePlate = new THREE.Mesh(
    new THREE.BoxGeometry(
      dims.basePlateWidth,
      dims.basePlateHeight,
      dims.basePlateThickness,
      dims.basePlateDepth
    ),
    materials[params.materialType]
  );
  basePlate.position.y = -dims.height / 2 + dims.height * 0.3;
  handle.add(basePlate);

  const handleGroup = new THREE.Group();
  const verticalGeometry = new THREE.CylinderGeometry(
    dims.handleTubeRadius,
    dims.handleTubeRadius,
    dims.handleHeight,
    16
  );

  const leftVertical = new THREE.Mesh(
    verticalGeometry,
    materials[params.materialType]
  );
  leftVertical.position.set(-dims.handleWidth / 2, 0, dims.handleDepth);
  handleGroup.add(leftVertical);

  const rightVertical = new THREE.Mesh(
    verticalGeometry,
    materials[params.materialType]
  );
  rightVertical.position.set(dims.handleWidth / 2, 0, dims.handleDepth);
  handleGroup.add(rightVertical);

  const horizontalGeometry = new THREE.CylinderGeometry(
    dims.handleTubeRadius,
    dims.handleTubeRadius,
    dims.handleWidth - dims.handleTubeRadius * 2,
    16
  );
  const horizontalHandle = new THREE.Mesh(
    horizontalGeometry,
    materials[params.materialType]
  );
  horizontalHandle.rotation.z = Math.PI / 2;
  horizontalHandle.position.set(0, dims.handleHeight / 2, dims.handleDepth);
  handleGroup.add(horizontalHandle);

  const rubberGeometry = new THREE.CylinderGeometry(
    dims.handleTubeRadius + dims.rubberThickness,
    dims.handleTubeRadius + dims.rubberThickness,
    dims.handleWidth - dims.handleTubeRadius * 4,
    16
  );
  const rubberGrip = new THREE.Mesh(rubberGeometry, materials.rubber);
  rubberGrip.rotation.z = Math.PI / 2;
  rubberGrip.position.set(0, dims.handleHeight / 2, dims.handleDepth);
  handleGroup.add(rubberGrip);

  handleGroup.position.y = basePlate.position.y;
  handle.add(handleGroup);

  const boltGeometry = new THREE.CylinderGeometry(
    4,
    4,
    dims.basePlateThickness * 2,
    6
  );
  const boltPositions = [
    [-dims.basePlateWidth / 3, basePlate.position.y + 30],
    [dims.basePlateWidth / 3, basePlate.position.y + 30],
    [-dims.basePlateWidth / 3, basePlate.position.y - 30],
    [dims.basePlateWidth / 3, basePlate.position.y - 30],
  ];

  boltPositions.forEach(([x, y]) => {
    const bolt = new THREE.Mesh(boltGeometry, materials[params.materialType]);
    bolt.position.set(x, y, 0);
    bolt.rotation.x = Math.PI / 2;
    handle.add(bolt);
  });

  return handle;
}

// Add handle functions
function addHandles(scene, box) {
  if (!config.enableHandles) return;

  const leftHandle = createHandle();
  leftHandle.position.set(-dims.length / 2, dims.height / 2, 0);
  leftHandle.rotation.y = Math.PI / 2;
  leftHandle.rotation.x = Math.PI;
  scene.add(leftHandle);

  const rightHandle = createHandle();
  rightHandle.position.set(dims.length / 2, dims.height / 2, 0);
  rightHandle.rotation.y = -Math.PI / 2;
  rightHandle.rotation.x = Math.PI;
  scene.add(rightHandle);
}

function addCastorWheels(box) {
  const wheelPositions = [
    {
      x: dims.length / 2 - dims.wheelOffset,
      z: dims.width / 2 - dims.wheelOffset,
    },
    {
      x: -dims.length / 2 + dims.wheelOffset,
      z: dims.width / 2 - dims.wheelOffset,
    },
    {
      x: dims.length / 2 - dims.wheelOffset,
      z: -dims.width / 2 + dims.wheelOffset,
    },
    {
      x: -dims.length / 2 + dims.wheelOffset,
      z: -dims.width / 2 + dims.wheelOffset,
    },
  ];

  wheelPositions.forEach(pos => {
    const wheel = createCastorWheel();
    wheel.position.set(pos.x, -dims.wheelDiameter / 2, pos.z);
    wheel.rotation.y = Math.PI / 4;
    box.add(wheel);
  });
}

// Initialize everything
function initBox() {
  const { scene, camera, renderer, controls } = initScene();

  // Set up lighting
  addLights(scene);

  // Create main box
  const box = createBox();

  // Add features based on configuration
  if (config.enableHandles) {
    addHandles(scene, box);
  }
  if (config.enableWheels) {
    addCastorWheels(box);
  }

  // Enable shadows
  enableShadows(box);
  addShadowCatcher(scene);

  // Add box to scene
  scene.add(box);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Handle window resizing
  window.addEventListener(
    'resize',
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );

  if (config.enableLid) {
    // 1) Create the lid using your function
    const lid = createBoxLid();

    // 2) Shift it so the back edge is at lidGroup's local origin
    positionLidForHinge(lid);

    // 3) Create a new pivot group (with no rotation)
    const pivotGroup = new THREE.Group();

    // 4) Add the rotated lid to the pivot group
    pivotGroup.add(lid);

    // 5) Position the pivot at the box's top back edge
    //    (Typically, the back edge is at z = -dims.width/2 and the top is at y = dims.height.
    //     Here we add some extra offsets (+4 in y and -5 in z) for fine-tuning.)
    pivotGroup.position.set(0, getLidYPosition() + 3, -(dims.width / 2) - 3);

    // 6) Rotate the pivot group 45° so it stands upright (flips up from the back)
    pivotGroup.rotation.x = -Math.PI / 4; 

    // Finally, add the pivot group to the scene.
    scene.add(pivotGroup);
    if (params.enableLock) {
  // box is the main box group
  // pivotGroup is the group containing the lid
  // the actual lid object is pivotGroup.children[0], or you can pass pivotGroup if you prefer
      addLock(scene, box, lid); 
  // OR: addLock(scene, box, lid);
    }
  }

  return box;
}

// Start the application
const box = initBox();

function createBox() {
  const box = new THREE.Group();

  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(dims.length, dims.thickness, dims.width),
    materials[params.materialType] // Use selected material
  );
  base.position.y = -dims.thickness / 2;
  box.add(base);

  // Create walls
  const wallConfigs = [
    {
      width: dims.length,
      height: dims.height,
      position: [0, dims.height / 2, dims.width / 2],
      rotation: [0, 0, 0],
      isHandleSide: false,
    },
    {
      width: dims.length,
      height: dims.height,
      position: [0, dims.height / 2, -dims.width / 2],
      rotation: [0, Math.PI, 0],
      isHandleSide: false,
    },
    {
      width: dims.width,
      height: dims.height,
      position: [-dims.length / 2, dims.height / 2, 0],
      rotation: [0, -Math.PI / 2, 0],
      isHandleSide: true,
    },
    {
      width: dims.width,
      height: dims.height,
      position: [dims.length / 2, dims.height / 2, 0],
      rotation: [0, Math.PI / 2, 0],
      isHandleSide: true,
    },
  ];

  wallConfigs.forEach(({ width, height, position, rotation, isHandleSide }) => {

    const wall = createWallWithHandle(width, height, isHandleSide);

    wall.position.set(...position);
    wall.rotation.set(...rotation);
    box.add(wall);
  });

  // Add features based on configuration
  if (config.enableRibs) {
    addRibs(box);
  }
  addSteppedEdges(box);

  if (config.enableRubberLining) {
    addTopRubberLining(box);
  }

  return box;
}

// Initialize everything
function addLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
  mainLight.position.set(200, 200, 400);
  mainLight.castShadow = true;
  scene.add(mainLight);

  const fillLights = [
    { pos: [-150, 150, 150], intensity: 4.2 },
    { pos: [150, -150, -150], intensity: 4 },
    { pos: [0, 200, 0], intensity: 4.5 },
  ];

  fillLights.forEach(({ pos, intensity }) => {
    const light = new THREE.DirectionalLight(0xffffff, intensity);
    light.position.set(...pos);
    scene.add(light);
  });
}

function enableShadows(object) {
  if (object instanceof THREE.Mesh) {
    object.castShadow = true;
    object.receiveShadow = true;
  }
  if (object.children) {
    object.children.forEach(child => enableShadows(child));
  }
}

function addShadowCatcher(scene) {
  const shadowGeo = new THREE.PlaneGeometry(800, 800);
  const shadowMat = new THREE.ShadowMaterial({
    opacity: 0.08,
  });
  const shadowCatcher = new THREE.Mesh(shadowGeo, shadowMat);

  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -dims.thickness;
  shadowCatcher.position.z = -100;
  shadowCatcher.receiveShadow = true;

  scene.add(shadowCatcher);
}

window.addEventListener('load', () => {
    setTimeout(() => {
        init();
    }, 500); // Give embed time to fully load
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh render if needed
        renderer.render(scene, camera);
    }
});
