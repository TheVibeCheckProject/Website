var THREE = window.THREE;

// Initialize Scene
window.scene = new THREE.Scene();

// Initialize Camera
window.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
window.camera.position.set(0, 6, 14);
window.camera.lookAt(0, 2, 0);

// Initialize Renderer
window.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
window.renderer.shadowMap.enabled = true;
window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
window.renderer.toneMapping = THREE.ACESFilmicToneMapping;
window.renderer.toneMappingExposure = 1.1;
window.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
window.renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(window.renderer.domElement);

// Initialize OrbitControls
window.controls = new THREE.OrbitControls(window.camera, window.renderer.domElement);
window.controls.enableDamping = true;
window.controls.dampingFactor = 0.05;
window.controls.maxPolarAngle = Math.PI / 2 - 0.05;

// Initialize UnrealBloomPass
const composer = new THREE.EffectComposer(window.renderer);
composer.addPass(new THREE.RenderPass(window.scene, window.camera));
const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.4, 0.25);
composer.addPass(bloomPass);
composer.setSize(window.innerWidth, window.innerHeight);
window.composer = composer;

// Master Animation Loop
window.sanctuaryUpdateCallbacks = [];
let prevTime = performance.now();

function animate(now) {
    requestAnimationFrame(animate);
    const delta = Math.min((now - prevTime) * 0.001, 0.1);
    prevTime = now;
    for (const cb of window.sanctuaryUpdateCallbacks) cb(delta, now * 0.001);
    if (window.playerFollowCamera) {
        // Player follow takes precedence
    } else {
        window.controls.update();
    }
    composer.render();
}

animate();

// Window Resize Handler
window.addEventListener('resize', function() {
    window.camera.aspect = window.innerWidth / window.innerHeight;
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});