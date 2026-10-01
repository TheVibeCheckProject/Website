import * as THREE from 'three';

// Background and Fog
window.scene.background = new THREE.Color(0x060512);
window.scene.fog = new THREE.FogExp2(0x060512, 0.018);

// Ethereal Lighting
const ambientLight = new THREE.AmbientLight(0x1a1233, 0.8);
window.scene.add(ambientLight);

const centralPointLight = new THREE.PointLight(0x00e5ff, 2.5, 30, 2);
centralPointLight.position.set(0, 6, 0);
window.scene.add(centralPointLight);

const secondaryPointLight = new THREE.PointLight(0x9b51e0, 2.0, 35, 2);
secondaryPointLight.position.set(0, 12, 0);
window.scene.add(secondaryPointLight);

// Multi-Layered Particle Stardust System
const particleCount = 2500;
const particlesGeometry = new THREE.BufferGeometry();
const positions = [];
const colors = [];

for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = 10 + Math.random() * 20;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions.push(x, y, z);

    // Blend between bioluminescent cyan, lavender, and warm starlight
    const color = new THREE.Color().setHSL(
        Math.random() * 0.5, // Hue between 0 and 0.5 for desired colors
        0.8, // Saturation
        0.5 // Lightness
    );
    colors.push(color.r, color.g, color.b);
}

particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
window.scene.add(particles);

// Animation Update Callback
function animateParticles(time) {
    const positions = particlesGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        // Sine wave breathing motion
        positions[i + 1] = y + Math.sin(x * 0.1 + time * 0.1) * Math.sin(z * 0.1 + time * 0.1) * 0.5;
    }
    particlesGeometry.attributes.position.needsUpdate = true;
}

// Twilight Obsidian Ground
const groundGeometry = new THREE.CircleGeometry(50, 64);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1c24,
    roughness: 0.1,
    metalness: 0.9,
    side: THREE.DoubleSide
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
window.scene.add(ground);

// Add animation loop
function animate(time) {
    requestAnimationFrame(animate);
    animateParticles(time);
}
animate(0);