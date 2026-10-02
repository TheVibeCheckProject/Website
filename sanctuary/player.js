var THREE = window.THREE;

var playerPosition = new THREE.Vector3(0, 0, 8);
var playerVelocity = new THREE.Vector3();
var playerSpeed = 8.0;
var playerRotation = 0;
var targetRotation = 0;
var isMoving = false;

var keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', function(e) {
    if (keys.hasOwnProperty(e.key)) { keys[e.key] = true; }
});
window.addEventListener('keyup', function(e) {
    if (keys.hasOwnProperty(e.key)) { keys[e.key] = false; }
});

var playerContainer = new THREE.Group();
playerContainer.position.copy(playerPosition);
window.scene.add(playerContainer);

var playerMixer = null;
var walkAction = null;
var idleAction = null;

// Load Rigged Spirit Wanderer (Fox)
var gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('assets/actor.glb', function(gltf) {
    var actorModel = gltf.scene;
    actorModel.scale.set(0.02, 0.02, 0.02);
    actorModel.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    playerContainer.add(actorModel);

    // Setup animations
    if (gltf.animations && gltf.animations.length > 0) {
        playerMixer = new THREE.AnimationMixer(actorModel);
        // Common clip names: Survey, Walk, Run
        idleAction = playerMixer.clipAction(gltf.animations[0]);
        idleAction.play();
        if (gltf.animations.length > 1) {
            walkAction = playerMixer.clipAction(gltf.animations[1] || gltf.animations[2]);
        }
    }
    console.log('[Player] Controllable 3D Spirit Wanderer loaded.');
}, undefined, function(err) {
    console.error('[Player] Failed to load actor.glb:', err);
});

// Camera Follow System
var cameraOffset = new THREE.Vector3(0, 3.5, 6.5);
window.playerFollowCamera = true;

// Player Movement & Frame Loop
if (window.sanctuaryUpdateCallbacks) {
    window.sanctuaryUpdateCallbacks.push(function(delta, time) {
        var forward = (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0);
        var strafe = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0);
        
        isMoving = (forward !== 0 || strafe !== 0);

        if (isMoving) {
            var moveAngle = Math.atan2(strafe, forward);
            targetRotation = moveAngle;
            
            var moveDir = new THREE.Vector3(strafe, 0, -forward).normalize();
            playerPosition.x += moveDir.x * playerSpeed * delta;
            playerPosition.z += moveDir.z * playerSpeed * delta;

            // Clamping inside the sanctuary bounds
            var dist = Math.sqrt(playerPosition.x * playerPosition.x + playerPosition.z * playerPosition.z);
            if (dist > 38) {
                playerPosition.x = (playerPosition.x / dist) * 38;
                playerPosition.z = (playerPosition.z / dist) * 38;
            }
        }

        // Smooth rotation interpolation
        playerRotation += (targetRotation - playerRotation) * 0.15;
        playerContainer.rotation.y = playerRotation;

        // Ground Height Tracking
        var groundY = window.getTerrainHeight ? window.getTerrainHeight(playerPosition.x, playerPosition.z) : 0;
        playerPosition.y = groundY;
        playerContainer.position.copy(playerPosition);

        // Update animation mixer
        if (playerMixer) {
            playerMixer.update(delta * (isMoving ? 1.4 : 0.8));
        }

        // Camera Follow
        if (window.camera) {
            var desiredCameraPos = new THREE.Vector3(
                playerPosition.x - Math.sin(playerRotation * 0.3) * 2,
                playerPosition.y + cameraOffset.y,
                playerPosition.z + cameraOffset.z
            );
            window.camera.position.lerp(desiredCameraPos, 0.08);
            var lookAtTarget = playerPosition.clone().add(new THREE.Vector3(0, 1.2, 0));
            window.camera.lookAt(lookAtTarget);
        }
    });
}
