var THREE = window.THREE;

window.scene = new THREE.Scene();
window.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
window.camera.position.set(0, 8, 24);
window.camera.lookAt(0, 5, 0);

window.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
window.renderer.toneMapping = THREE.ACESFilmicToneMapping;
window.renderer.toneMappingExposure = 1.15;
window.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
window.renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(window.renderer.domElement);

window.controls = new THREE.OrbitControls(window.camera, window.renderer.domElement);
window.controls.enableDamping = true;
window.controls.dampingFactor = 0.05;
window.controls.minDistance = 8;
window.controls.maxDistance = 50;
window.controls.minPolarAngle = Math.PI / 4;
window.controls.maxPolarAngle = Math.PI / 2 - 0.03;

const composer = new THREE.EffectComposer(window.renderer);
composer.addPass(new THREE.RenderPass(window.scene, window.camera));
const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.45, 0.2);
composer.addPass(bloomPass);
window.composer = composer;

window.sanctuaryUpdateCallbacks = [];
function animate(time) {
    requestAnimationFrame(animate);
    window.controls.update();
    for (const cb of window.sanctuaryUpdateCallbacks) cb(time * 0.001);
    composer.render();
}
animate();

window.addEventListener('resize', () => {
    window.camera.aspect = window.innerWidth / window.innerHeight;
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('sanctuary-unlocked', () => {
    const targetPosition = new THREE.Vector3(0, 7, 22);
    const startPosition = window.camera.position.clone();
    const duration = 3000; // Duration in milliseconds
    let startTime = null;

    function lerpCamera(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const t = Math.min(elapsed / duration, 1);
        window.camera.position.lerpVectors(startPosition, targetPosition, t);
        if (t < 1) {
            requestAnimationFrame(lerpCamera);
        }
    }

    requestAnimationFrame(lerpCamera);
});