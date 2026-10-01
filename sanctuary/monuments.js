import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Central Crystalline Spire
const spireGeometry = new THREE.CylinderGeometry(0.2, 1.8, 13, 6, 1, true, 0, Math.PI * 2, false);
const spireMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x120c24,
    roughness: 0.15,
    metalness: 0.85,
    emissive: 0x4a148c,
    emissiveIntensity: 0.6
});
const spire = new THREE.Mesh(spireGeometry, spireMaterial);
spire.position.y = 6; // Centered height
scene.add(spire);

// Kinetic Orbital Starlight Rings
const createRing = (radius, tiltAngle, rotationSpeed, emissiveColor) => {
    const ringGeometry = new THREE.TorusGeometry(radius, 0.08, 16, 120);
    const ringMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.9,
        emissive: emissiveColor,
        emissiveIntensity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = tiltAngle;
    ring.userData.rotationSpeed = rotationSpeed;
    scene.add(ring);
    return ring;
};

const ring1 = createRing(4.5, Math.PI / 6, 0.01, 0x00e5ff); // 30 degrees tilt
const ring2 = createRing(6.5, -Math.PI / 4, -0.005, 0x9b51e0); // -45 degrees tilt
const ring3 = createRing(8.5, 0, 0.002, 0xffffff); // Equatorial

// Floating starlight particles for ring 3
const particleCount = 100;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const x = ring3.geometry.parameters.radius * Math.sin(phi) * Math.cos(theta);
    const y = ring3.geometry.parameters.radius * Math.sin(phi) * Math.sin(theta);
    const z = ring3.geometry.parameters.radius * Math.cos(phi);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particlesMaterial = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff, transparent: true, opacity: 0.8 });
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
ring3.add(particles);

// Animation loop
const animate = (time) => {
    requestAnimationFrame(animate);

    // Spire bobbing
    spire.position.y = 6 + Math.sin(time * 0.8) * 0.4;

    // Rotating rings
    ring1.rotation.z += ring1.userData.rotationSpeed;
    ring2.rotation.z -= ring2.userData.rotationSpeed;
    ring3.rotation.z += ring3.userData.rotationSpeed;

    // Breathing light effect
    spire.material.emissiveIntensity = 0.6 + Math.sin(time * 0.5) * 0.2;

    renderer.render(scene, camera);
};

animate();

// Hook into sanctuaryUpdateCallbacks
window.sanctuaryUpdateCallbacks = window.sanctuaryUpdateCallbacks || [];
window.sanctuaryUpdateCallbacks.push(animate);