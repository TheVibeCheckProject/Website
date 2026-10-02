var THREE = window.THREE;

// Player setup
var player;
var playerMesh;
var playerSpeed = 6;
var playerRunSpeed = 12;
var isRunning = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var playerPosition = new THREE.Vector3(0, 0, 0);
var playerTargetRotation = 0;
var playerCurrentRotation = 0;
var playerRotationSpeed = 0.1;

// Camera setup
var cameraOffset = new THREE.Vector3(-7, 4, 0);
var cameraLookAtOffset = new THREE.Vector3(0, 1.8, 0);

// Load player model
var loader = new THREE.GLTFLoader();
loader.load('assets/actor.glb', function(gltf) {
    playerMesh = gltf.scene;
    playerMesh.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    playerMesh.position.set(0, getTerrainHeight(0, 0), 0);
    window.scene.add(playerMesh);
}, undefined, function(error) {
    console.error('Failed to load actor model:', error);
    createProceduralPlayer();
});

function createProceduralPlayer() {
    // Create a slender humanoid avatar
    var bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;

    // Create a glowing enchanted cloak
    var cloakGeometry = new THREE.ConeGeometry(1, 2, 32);
    var cloakMaterial = new THREE.MeshStandardMaterial({ color: 0xADD8E6, emissive: 0xADD8E6, transparent: true, opacity: 0.6 });
    var cloak = new THREE.Mesh(cloakGeometry, cloakMaterial);
    cloak.rotation.x = Math.PI / 2;
    cloak.position.y = 2;

    // Create a hood/head
    var headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;

    // Create a glowing eye wisp
    var eyeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    var eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF });
    var eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0.3, 0.1, 0.3);

    // Create a floating companion orb
    var orbGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    var orbMaterial = new THREE.MeshStandardMaterial({ color: 0xFFA500, emissive: 0xFFA500, transparent: true, opacity: 0.8 });
    var orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(1, 1, 1);

    // Combine all parts into the player mesh
    playerMesh = new THREE.Group();
    playerMesh.add(body);
    playerMesh.add(cloak);
    playerMesh.add(head);
    head.add(eye);
    playerMesh.add(orb);
    playerMesh.position.set(0, getTerrainHeight(0, 0), 0);
    window.scene.add(playerMesh);
}

// Keyboard input controller
document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'w':
        case 'ArrowUp':
            moveForward = true;
            break;
        case 's':
        case 'ArrowDown':
            moveBackward = true;
            break;
        case 'a':
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'd':
        case 'ArrowRight':
            moveRight = true;
            break;
        case 'Shift':
            isRunning = true;
            break;
    }
});

document.addEventListener('keyup', function(event) {
    switch (event.key) {
        case 'w':
        case 'ArrowUp':
            moveForward = false;
            break;
        case 's':
        case 'ArrowDown':
            moveBackward = false;
            break;
        case 'a':
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'd':
        case 'ArrowRight':
            moveRight = false;
            break;
        case 'Shift':
            isRunning = false;
            break;
    }
});

// Physics & Movement Update
function updatePlayerMovement(deltaTime) {
    var speed = isRunning ? playerRunSpeed : playerSpeed;
    var direction = new THREE.Vector3();

    if (moveForward) direction.z -= 1;
    if (moveBackward) direction.z += 1;
    if (moveLeft) direction.x -= 1;
    if (moveRight) direction.x += 1;

    direction.normalize();

    // Calculate movement vector relative to camera direction
    var cameraDirection = new THREE.Vector3();
    window.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    var rightVector = new THREE.Vector3();
    rightVector.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).normalize();

    var moveVector = new THREE.Vector3();
    moveVector.copy(cameraDirection).multiplyScalar(direction.z);
    moveVector.add(rightVector.multiplyScalar(direction.x));

    // Smoothly rotate the character mesh to face the movement direction
    if (moveVector.length() > 0) {
        playerTargetRotation = Math.atan2(moveVector.x, moveVector.z);
    }

    playerCurrentRotation = THREE.MathUtils.lerp(playerCurrentRotation, playerTargetRotation, playerRotationSpeed);
    playerMesh.rotation.y = playerCurrentRotation;

    // Apply speed
    moveVector.multiplyScalar(speed * deltaTime);

    // Update player position
    playerPosition.add(moveVector);
    playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, -45, 45);
    playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, -45, 45);
    playerPosition.y = getTerrainHeight(playerPosition.x, playerPosition.z);

    playerMesh.position.copy(playerPosition);
}

// Third-Person Follow Camera
function updateCamera() {
    var desiredCameraPos = playerPosition.clone().add(cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCurrentRotation));
    window.camera.position.lerp(desiredCameraPos, 0.08);

    var lookTarget = playerPosition.clone().add(cameraLookAtOffset);
    window.camera.lookAt(lookTarget);
}

// Register update in sanctuaryUpdateCallbacks
window.sanctuaryUpdateCallbacks.push(function(deltaTime) {
    if (moveForward || moveBackward || moveLeft || moveRight) {
        window.playerFollowCamera = true;
    }
    updatePlayerMovement(deltaTime);
    updateCamera();
});