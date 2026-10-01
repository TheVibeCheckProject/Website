const THREE = window.THREE;

// Central Crystalline Obelisk / Spire
const spireGeometry = new THREE.CylinderGeometry(0.2, 1.8, 14, 6);
const spireMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x120c24,
    roughness: 0.12,
    metalness: 0.88,
    emissive: 0x4a148c,
    emissiveIntensity: 0.65,
    clearcoat: 0.8
});
const spire = new THREE.Mesh(spireGeometry, spireMaterial);
spire.position.set(0, 7, 0);

// Inner glowing core lattice
const coreGeometry = new THREE.CylinderGeometry(0.1, 1.7, 14, 6);
const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x120c24,
    roughness: 0.12,
    metalness: 0.88,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.0,
    clearcoat: 0.8
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
core.position.set(0, 0, 0);
spire.add(core);

window.scene.add(spire);

// Kinetic Orbital Starlight Rings (Gyroscope)
const createRing = (radius, tilt, emissiveColor, emissiveIntensity, speed) => {
    const ringGeometry = new THREE.TorusGeometry(radius, 0.07, 16, 120);
    const ringMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x120c24,
        roughness: 0.12,
        metalness: 0.88,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity,
        clearcoat: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = THREE.MathUtils.degToRad(tilt);
    ring.speed = speed;
    return ring;
};

const ring1 = createRing(4.5, 30, 0x00f0ff, 0.9, 0.015);
const ring2 = createRing(6.8, -45, 0x9b51e0, 0.85, -0.01);
const ring3 = createRing(9.2, 10, 0xffd166, 0.8, 0.006);

// Glowing particle motes for the outer ring
const moteGeometry = new THREE.SphereGeometry(0.02, 8, 8);
const moteMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
    clearcoat: 0.8
});

for (let i = 0; i < 50; i++) {
    const mote = new THREE.Mesh(moteGeometry, moteMaterial);
    const angle = Math.random() * Math.PI * 2;
    mote.position.x = ring3.geometry.parameters.radius * Math.cos(angle);
    mote.position.z = ring3.geometry.parameters.radius * Math.sin(angle);
    mote.position.y = Math.random() * 0.1 - 0.05;
    mote.rotation.x = Math.random() * Math.PI * 2;
    mote.rotation.y = Math.random() * Math.PI * 2;
    mote.rotation.z = Math.random() * Math.PI * 2;
    ring3.add(mote);
}

window.scene.add(ring1);
window.scene.add(ring2);
window.scene.add(ring3);

// Animation Callback
window.sanctuaryUpdateCallbacks.push((time) => {
    // Spire floating and breathing
    spire.position.y = 7 + Math.sin(time * 0.8) * 0.35;
    spire.material.emissiveIntensity = 0.65 + Math.sin(time * 1.2) * 0.25;

    // Rotating rings
    ring1.rotation.y += ring1.speed;
    ring2.rotation.y += ring2.speed;
    ring3.rotation.y += ring3.speed;
});