const THREE = window.THREE;

// Define the relics
const relics = [
    { name: "The Anchor of Stillness", pos: [8, 4.5, 4], color: 0x00f0ff, freq: 432, quote: "Peace is not the absence of the storm, but the quiet center inside it." },
    { name: "The Beacon of Courage", pos: [-8, 5.0, 4], color: 0xffaa00, freq: 486, quote: "You don't need to see the entire staircase. Just take the first step with an open heart." },
    { name: "The Mirror of Self-Forgiveness", pos: [0, 6.0, -9], color: 0xff70a6, freq: 540, quote: "You did the best you could with what you knew. Let yourself rest now." },
    { name: "The Horizon of Possibility", pos: [5, 4.5, -7], color: 0xa855f7, freq: 648, quote: "What is meant for you will not pass you by. Keep breathing, keep moving." }
];

// Create relic meshes
window.sanctuaryRelicMeshes = [];
const sphereGeometry = new THREE.SphereGeometry(0.85, 32, 32);
const particleGeometry = new THREE.SphereGeometry(1.2, 32, 32);

relics.forEach((relic, i) => {
    const material = new THREE.MeshStandardMaterial({
        color: relic.color,
        emissive: relic.color,
        emissiveIntensity: 0.5,
        roughness: 0.8
    });

    const mesh = new THREE.Mesh(sphereGeometry, material);
    mesh.position.set(...relic.pos);
    mesh.userData = { ...relic, originalScale: 1.0, basePos: relic.pos };

    // Create particle halo
    const particleMaterial = new THREE.PointsMaterial({ size: 0.05, color: relic.color, transparent: true, opacity: 0.8 });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.position.copy(mesh.position);

    window.scene.add(mesh);
    window.scene.add(particles);

    window.sanctuaryRelicMeshes.push({ mesh, particles });
});

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerdown', onPointerDown);

function onPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, window.camera);
    const intersects = raycaster.intersectObjects(window.sanctuaryRelicMeshes.map(relic => relic.mesh));

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        intersected.scale.set(1.25, 1.25, 1.25);
        intersected.material.emissiveIntensity = 1.0;
        document.body.style.cursor = 'pointer';
    } else {
        window.sanctuaryRelicMeshes.forEach(relic => {
            relic.mesh.scale.set(1.0, 1.0, 1.0);
            relic.mesh.material.emissiveIntensity = 0.5;
        });
        document.body.style.cursor = 'default';
    }
}

function onPointerDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, window.camera);
    const intersects = raycaster.intersectObjects(window.sanctuaryRelicMeshes.map(relic => relic.mesh));

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const userData = intersected.userData;

        if (window.playCrystalChime) {
            window.playCrystalChime(userData.freq, 2.5);
        }

        document.getElementById('relic-title').textContent = userData.name;
        document.getElementById('relic-quote').textContent = userData.quote;
        document.getElementById('relic-modal').classList.add('active');
    }
}

// Modal close
document.getElementById('relic-close').addEventListener('click', () => {
    document.getElementById('relic-modal').classList.remove('active');
});

window.addEventListener('click', (event) => {
    if (event.target.id === 'relic-modal') {
        document.getElementById('relic-modal').classList.remove('active');
    }
});

// Animation callback
window.sanctuaryUpdateCallbacks = window.sanctuaryUpdateCallbacks || [];
window.sanctuaryUpdateCallbacks.push((time) => {
    window.sanctuaryRelicMeshes.forEach((relic, i) => {
        relic.mesh.position.y = relic.mesh.userData.basePos[1] + Math.sin(time * 1.5 + i) * 0.4;
        relic.particles.rotation.y += 0.005;
    });
});