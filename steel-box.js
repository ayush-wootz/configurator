import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Define rubber color options
const RUBBER_COLORS = {
    black: '0x111111',
    blue: '0x0047AB',  // Cobalt Blue
    steel: '0xC0C0C0'  // Steel Grey
};

// Initialize scene
function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xE4E4E4);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(500, 500, 500);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.body.appendChild(renderer.domElement);
    
    return { scene, camera, renderer };
}

function getURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        length: parseInt(urlParams.get('len')) || 380,
        width: parseInt(urlParams.get('wid')) || 207,
        height: parseInt(urlParams.get('hei')) || 200,
        enableHandles: urlParams.get('handle') === 'true' || true,
        enablePerforation: urlParams.get('perf') === 'true' || true,
        enableWheels: urlParams.get('wheel') === 'true' || true,
        enableRibs: urlParams.get('ribs') === 'true' || false,
        enableStraightTop: urlParams.get('straight') === 'true' || true,
        enableRubberLining: urlParams.get('rubber') === 'true' || true,
        rubberColor: RUBBER_COLORS[urlParams.get('rubberColor') || 'blue'],
        rubberThickness: parseInt(urlParams.get('rubberThick')) || 2,
        rubberHeight: parseInt(urlParams.get('rubberHeight')) || 5,
        rubberOverhang: parseInt(urlParams.get('rubberOverhang')) || 0
    };
}

const params = getURLParameters();

// Configuration object
const config = {
    enableHandles: params.enableHandles,
    enablePerforation: params.enablePerforation,
    enableWheels: params.enableWheels,
    enableRibs: params.enableRibs,
    enableStraightTop: params.enableStraightTop
};

const step_dims = {
    stepHeight: 8,
    stepInset: 8
};

// Setting up the Box dimensions
const dims = {
    length: params.length,
    width: params.width,
    height: params.height + (config.enableStraightTop ? step_dims.stepHeight*2 + step_dims.stepInset*2 : 0),
    thickness: 2,
    wheelDiameter: 42,
    wheelThickness: 10,
    wheelOffset: 30
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
dims.basePlateYposition = -dims.height/2 + (dims.height * 0.3);

// Add rib parameters
dims.ribDepth = 1;
dims.ribWidth = 12;
dims.ribInterval = 200;

// Add rubber lining parameters
dims.rubberLining = {
    thickness: params.rubberThickness,
    height: params.rubberHeight,
    overhang: params.rubberOverhang,
    verticalOffset: config.enableStraightTop ? 0 : step_dims.stepHeight*2 + step_dims.stepInset*2
};

// Materials
const materials = {
    steel: new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        metalness: 0.9,
        roughness: 0.6,
        reflectivity: 0.8,
        clearcoat: 0.1,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide
    }),
    darkSteel: new THREE.MeshStandardMaterial({
        color: 0xEEEEEE,
        metalness: 0.85,
        roughness: 0.35,
        reflectivity: 0.7,
        clearcoat: 0.1,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide
    }),
    rubber: new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.0,
        roughness: 0.9,
        side: THREE.DoubleSide
    }),
    fibreglass: new THREE.MeshStandardMaterial({
        color: 0xE0E0E0,
        metalness: 0.2,
        roughness: 0.8,
        side: THREE.DoubleSide
    }),
    wheelRubber: new THREE.MeshStandardMaterial({
        color: 0x101010,
        metalness: 0.0,
        roughness: 0.9,
        side: THREE.DoubleSide
    })
};

// Create rubber material with configurable color
function createRubberMaterial(color) {
    return new THREE.MeshStandardMaterial({
        color: parseInt(color),
        metalness: 0.0,
        roughness: 0.95,
        side: THREE.DoubleSide
    });
}

// Create perforated wall
function createPerforatedWall(width, height, isHandleSide = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = 10;
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const holeRadius = 1.5 * scale;
    const holePitch = 12 * scale;
    const margin = holePitch;
    
    const handlePlateWidth = dims.basePlateWidth * scale;
    const handlePlateHeight = dims.basePlateHeight * scale;
    
    const rows = Math.floor((height * scale - 2 * margin) / holePitch);
    const cols = Math.floor((width * scale - 2 * margin) / holePitch);
    
    ctx.fillStyle = 'black';
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = margin + j * holePitch + holePitch/2;
            const y = margin + i * holePitch + holePitch/2;
            
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
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.8,
        roughness: 0.3,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        transparent: true
    });
    
    const geometry = new THREE.PlaneGeometry(width, height);
    return new THREE.Mesh(geometry, material);
}

// Create wheel components
function createWheelSpokes() {
    const spokes = new THREE.Group();
    const spokeCount = 6;
    const spokeWidth = 4;
    const radius = dims.wheelDiameter/2 - 5;
    
    for(let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2;
        const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(radius, 2, spokeWidth),
            materials.fibreglass
        );
        spoke.position.x = radius/2;
        spoke.rotation.y = angle;
        spokes.add(spoke);
    }
    return spokes;
}

function createCastorWheel() {
    const wheel = new THREE.Group();

    const wheelCore = new THREE.CylinderGeometry(
        dims.wheelDiameter/2 - 5,
        dims.wheelDiameter/2 - 5,
        dims.wheelThickness,
        24
    );
    const wheelCoreMesh = new THREE.Mesh(wheelCore, materials.fibreglass);
    wheelCoreMesh.rotation.z = Math.PI/2;

    const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(dims.wheelDiameter/2, dims.wheelDiameter/2, dims.wheelThickness, 24),
        materials.wheelRubber
    );
    tire.rotation.z = Math.PI/2;

    const spokes = createWheelSpokes();
    const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, dims.wheelThickness + 2, 16),
        materials.steel
    );
    hub.rotation.z = Math.PI/2;

    const wheelAssembly = new THREE.Group();
    wheelAssembly.add(wheelCoreMesh, tire, spokes, hub);

    const bracket = new THREE.Group();
    const forkGeometry = new THREE.BoxGeometry(dims.wheelThickness + 5, 40, 5);
    const forkLeft = new THREE.Mesh(forkGeometry, materials.steel);
    const forkRight = new THREE.Mesh(forkGeometry, materials.steel);
    
    forkLeft.position.set(-(dims.wheelThickness/2 + 2.5), 20, 0);
    forkRight.position.set(dims.wheelThickness/2 + 2.5, 20, 0);

    const plateGeometry = new THREE.BoxGeometry(40, 5, 40);
    const plate = new THREE.Mesh(plateGeometry, materials.steel);
    plate.position.y = 40;

    bracket.add(forkLeft, forkRight, plate);
    wheel.add(wheelAssembly, bracket);

    return wheel;
}

// Continue with Part 3?

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
    const totalBasePlateArea = dims.basePlateHeight;
    return Math.abs(height - handleCenterY) < (totalBasePlateArea / 2);
}

function createRibSegment(width, startPos = 0, segmentWidth = null) {
    const points = [];
    const segments = 100;
    const ribDepth = dims.ribDepth/3;
    const ribWidth = dims.ribWidth/2;
    
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
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, materials.steel);
    
    if (startPos !== 0) {
        mesh.position.x = startPos;
    }
    
    return mesh;
}

function createSteppedEdge(length) {
   const shape = new THREE.Shape();
   const t = dims.thickness;
   const s = step_dims.stepInset;
   const h = step_dims.stepHeight;
   const bendR = 2.5;
   const hemLength = 15;

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
       bevelEnabled: false
   };
    
   const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
   return new THREE.Mesh(geometry, materials.steel);
}

function addSteppedEdges(box) {
    if (config.enableStraightTop) return;
    const vertOffset = step_dims.stepHeight*2 - step_dims.stepInset * 2;  // Offset to align with top edge
    
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

function addRibs(box) {
    const ribPositions = calculateRibPositions(dims.height);
    
    const wallConfigs = [
        {
            width: dims.length+0.5,
            position: [dims.length/2, 0, dims.width/2 + dims.thickness/2],
            rotation: [0, -Math.PI/2, 0],
            hasBasePlate: false,
            shiftAxis: 'z'
        },
        {
            width: dims.length+0.5,
            position: [-dims.length/1.99, 0, -dims.width/2 - dims.thickness/2],
            rotation: [0, Math.PI/2, 0],
            hasBasePlate: false,
            shiftAxis: 'z'
        },
        {
            width: dims.width+0.5,
            position: [-dims.length/2 - dims.thickness/2, dims.length/2, dims.width/1.98],
            rotation: [0, -Math.PI, 0],
            hasBasePlate: true,
            shiftAxis: 'x'
        },
        {
            width: dims.width+0.5,
            position: [dims.length/2, -dims.width, dims.width/1.99],
            rotation: [0, Math.PI, -Math.PI],
            hasBasePlate: true,
            shiftAxis: 'x'
        }
    ];

    ribPositions.forEach(height => {
        wallConfigs.forEach(config => {
            if (config.hasBasePlate && isInBasePlateArea(height)) {
                const indentWidth = dims.basePlateWidth;
                const indentStartPos = (config.width - indentWidth) / 2;
                const remainingWidth = (config.width - indentWidth) / 2;

                if (remainingWidth > 0) {
                    const beforeSegment = createRibSegment(config.width, 0, remainingWidth);
                    beforeSegment.position.set(...config.position);
                    beforeSegment.position.y = height;
                    beforeSegment.rotation.set(...config.rotation);
                    box.add(beforeSegment);

                    const afterSegment = createRibSegment(config.width, 0, remainingWidth);
                    const afterPosition = [...config.position];
                    
                    const shiftAmount = indentStartPos + indentWidth;
                    if (config.shiftAxis === 'x') {
                        afterPosition[2] -= shiftAmount+1;
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
        materials.steel
    );
    basePlate.position.y = -dims.height/2 + (dims.height * 0.3);
    handle.add(basePlate);
    
    const handleGroup = new THREE.Group();
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
    
    handleGroup.position.y = basePlate.position.y;
    handle.add(handleGroup);
    
    const boltGeometry = new THREE.CylinderGeometry(4, 4, dims.basePlateThickness * 2, 6);
    const boltPositions = [
        [-dims.basePlateWidth/3, basePlate.position.y + 30],
        [dims.basePlateWidth/3, basePlate.position.y + 30],
        [-dims.basePlateWidth/3, basePlate.position.y - 30],
        [dims.basePlateWidth/3, basePlate.position.y - 30]
    ];
    
    boltPositions.forEach(([x, y]) => {
        const bolt = new THREE.Mesh(boltGeometry, materials.darkSteel);
        bolt.position.set(x, y, 0);
        bolt.rotation.x = Math.PI/2;
        handle.add(bolt);
    });
    
    return handle;
}

function createTopRubberLining(width) {
    const shape = new THREE.Shape();
    const t = dims.rubberLining.thickness;
    const h = dims.rubberLining.height;
    const o = dims.rubberLining.overhang;
    
    // Create profile ensuring symmetry
    shape.moveTo(-o, -t/2);
    shape.lineTo(-o, h - t/2);       
    shape.lineTo(width + o, h - t/2);
    shape.lineTo(width + o, -t/2);
    shape.lineTo(width, -t/2);
    shape.lineTo(0, -t/2);
    shape.lineTo(-o, -t/2);

    const extrudeSettings = {
        steps: 1,
        depth: t,
        bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const rubberMaterial = new THREE.MeshStandardMaterial({
        color: parseInt(params.rubberColor),
        metalness: 0.0,
        roughness: 0.95,
        side: THREE.DoubleSide
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
                -dims.length/2,
                vertOffset,
                dims.width/2 - dims.thickness/2
            ],
            rotation: [0, 0, 0]
        },
        // Back wall
        {
            width: dims.length,
            position: [
                -dims.length/2,
                vertOffset,
                -dims.width/2 - dims.thickness/2
            ],
            rotation: [0, 0, 0]
        },
        // Left wall
        {
            width: dims.width,
            position: [
                -dims.length/2 - dims.thickness/66,
                vertOffset,
                dims.width/2
            ],
            rotation: [0, Math.PI/2, 0]
        },
        // Right wall
        {
            width: dims.width,
            position: [
                dims.length/2 - dims.thickness/1.03,
                vertOffset,
                dims.width/2
            ],
            rotation: [0, Math.PI/2, 0]
        }
    ];
    
    liningConfigs.forEach(config => {
        const lining = createTopRubberLining(config.width);
        lining.position.set(...config.position);
        lining.rotation.set(...config.rotation);
        box.add(lining);
    });
}

// Add handle functions
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

function addCastorWheels(box) {
    const wheelPositions = [
        {x: dims.length/2 - dims.wheelOffset, z: dims.width/2 - dims.wheelOffset},
        {x: -dims.length/2 + dims.wheelOffset, z: dims.width/2 - dims.wheelOffset},
        {x: dims.length/2 - dims.wheelOffset, z: -dims.width/2 + dims.wheelOffset},
        {x: -dims.length/2 + dims.wheelOffset, z: -dims.width/2 + dims.wheelOffset}
    ];

    wheelPositions.forEach((pos) => {
        const wheel = createCastorWheel();
        wheel.position.set(pos.x, -dims.wheelDiameter/2, pos.z);
        wheel.rotation.y = Math.PI/4;
        box.add(wheel);
    });
}

// Initialize everything
function initBox() {
    const { scene, camera, renderer } = initScene();
    const controls = new OrbitControls(camera, renderer.domElement);

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
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    return box;
}

// Start the application
const box = initBox();

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

    // Add features based on configuration
    if (config.enableRibs) {
        addRibs(box);
    }
    addSteppedEdges(box);
    addTopRubberLining(box);

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
        { pos: [-150, 150, 150], intensity: 1.2 },
        { pos: [150, -150, -150], intensity: 1.0 },
        { pos: [0, 200, 0], intensity: 1.5 }
    ];

    fillLights.forEach(({pos, intensity}) => {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.set(...pos);
        scene.add(light);
    });
}

function enableShadows(object) {
    if(object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
    }
    if(object.children) {
        object.children.forEach(child => enableShadows(child));
    }
}

function addShadowCatcher(scene) {
    const shadowGeo = new THREE.PlaneGeometry(800, 800);
    const shadowMat = new THREE.ShadowMaterial({
        opacity: 0.08
    });
    const shadowCatcher = new THREE.Mesh(shadowGeo, shadowMat);
    
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = -dims.thickness;
    shadowCatcher.position.z = -100;
    shadowCatcher.receiveShadow = true;
    
    scene.add(shadowCatcher);
}
