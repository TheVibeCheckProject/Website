import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

window.scene = new THREE.Scene();

window.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
window.camera.position.set(0, 8, 22);
window.camera.lookAt(0, 5, 0);

window.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
window.renderer.toneMapping = THREE.ACESFilmicToneMapping;
window.renderer.toneMappingExposure = 1.1;
window.renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(window.renderer.domElement);

window.controls = new THREE.OrbitControls(window.camera, window.renderer.domElement);
window.controls.enableDamping = true;
window.controls.dampingFactor = 0.05;
window.controls.minPolarAngle = Math.PI / 4;
window.controls.maxPolarAngle = Math.PI / 2 - 0.05;
window.controls.minDistance = 10;
window.controls.maxDistance = 45;

const composer = new EffectComposer(window.renderer);
composer.addPass(new RenderPass(window.scene, window.camera));

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.4, 0.4, 0.25);
composer.addPass(bloomPass);

window.sanctuaryUpdateCallbacks = [];

function animate() {
    requestAnimationFrame(animate);
    window.controls.update();
    composer.render();
    window.sanctuaryUpdateCallbacks.forEach(callback => callback());
}

animate();

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    window.camera.aspect = width / height;
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(width, height);
    composer.setSize(width, height);
});