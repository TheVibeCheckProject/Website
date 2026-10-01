import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Bloom setup
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
composer.addPass(bloomPass);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Relic Orbs
const relics = [
    {
        name: "The Anchor of Stillness",
        position: [8, 4, 4],
        color: 0x00FFFF,
        reflection: "Peace is not the absence of the storm, but the quiet center inside it."
    },
    {
        name: "The Beacon of Courage",
        position: [-8, 5, 4],
        color: 0xFFA500,
        reflection: "You don't need to see the entire staircase. Just take the first step with an open heart."
    },
    {
        name: "The Mirror of Self-Forgiveness",
        position: [0, 6, -9],
        color: 0xFFC0CB,
        reflection: "You did the best you could with what you knew. Let yourself rest now."
    },
    {
        name: "The Horizon of Possibility",
        position: [5, 4, -7],
        color: 0x9400D3,
        reflection: "What is meant for you will not pass you by. Keep breathing, keep moving."
    }
];

const geometry = new THREE.SphereGeometry(1, 32, 32);
const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);

const createOrb = (name, position, color, reflection) => {
    const material = new THREE.MeshStandardMaterial({
        emissive: color,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9
    });

    const orb = new THREE.Mesh(geometry, material);
    orb.position.set(...position);
    orb.name = name;
    orb.reflection = reflection;
    scene.add(orb);

    // Particle Halo
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: color, size: 0.2 }));
    particles.scale.set(2, 2, 2);
    orb.add(particles);

    return orb;
};

relics.forEach(relic => createOrb(relic.name, relic.position, relic.color, relic.reflection));

// Central Spire
const spireGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 32);
const spireMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
const spire = new THREE.Mesh(spireGeometry, spireMaterial);
spire.position.set(0, 7.5, 0);
scene.add(spire);

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);
window.addEventListener('touchstart', onTouchStart, false);

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onTouchStart(event) {
    mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    onClick(event);
}

function onClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0 && intersects[0].object.isMesh) {
        const orb = intersects[0].object;
        if (orb.name) {
            showModal(orb.name, orb.reflection);
            smoothFocusCamera(orb.position);
            playAudioChime(); // Assuming this function exists
        }
    }
}

// Modal setup
const modal = document.getElementById('relic-modal');
const modalContent = document.getElementById('modal-content');
const closeModalButton = document.getElementById('close-modal');

function showModal(name, reflection) {
    modalContent.innerHTML = `<h2>${name}</h2><p>${reflection}</p>`;
    modal.style.display = 'block';
}

function hideModal() {
    modal.style.display = 'none';
    smoothFocusCamera(new THREE.Vector3(0, 0, 0));
}

closeModalButton.addEventListener('click', hideModal);
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        hideModal();
    }
});

// Camera Focus
let targetPosition = new THREE.Vector3(0, 0, 0);
const focusSpeed = 0.05;

function smoothFocusCamera(position) {
    targetPosition.copy(position);
}

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);

    // Orbiting animation
    relics.forEach((relic, index) => {
        const orb = scene.getObjectByName(relic.name);
        const angle = Date.now() * 0.0005 + index * Math.PI / 2;
        const radius = 10;
        orb.position.x = Math.cos(angle) * radius;
        orb.position.z = Math.sin(angle) * radius;
        orb.position.y = 4 + Math.abs(Math.sin(angle)) * 2; // Vary height slightly
    });

    // Raycasting
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    scene.traverse((child) => {
        if (child.isMesh && child.name) {
            if (intersects.length > 0 && intersects[0].object === child) {
                child.scale.set(1.25, 1.25, 1.25);
                child.material.emissiveIntensity = 2.5;
            } else {
                child.scale.set(1, 1, 1);
                child.material.emissiveIntensity = 1.5;
            }
        }
    });

    // Smooth camera movement
    camera.position.lerp(targetPosition, focusSpeed);

    controls.update();
    composer.render();
};

animate();

// Resize handler
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    composer.setSize(width, height);
});