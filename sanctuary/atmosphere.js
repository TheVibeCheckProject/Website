const THREE = window.THREE;

// Set background and fog
window.scene.background = new THREE.Color(0x060512);
window.scene.fog = new THREE.FogExp2(0x060512, 0.018);

// Add ethereal dynamic lighting
const ambientLight = new THREE.AmbientLight(0x1a1233, 0.7);
window.scene.add(ambientLight);

const shrineCyanLight = new THREE.PointLight(0x00f0ff, 2.5, 35, 2);
shrineCyanLight.position.set(0, 6, 0);
window.scene.add(shrineCyanLight);

const twilightVioletLight = new THREE.PointLight(0x9b51e0, 2.0, 40, 2);
twilightVioletLight.position.set(0, 12, 0);
window.scene.add(twilightVioletLight);

const starlightDirectionalLight = new THREE.DirectionalLight(0xffecd2, 0.4);
starlightDirectionalLight.position.set(10, 20, 10);
window.scene.add(starlightDirectionalLight);

// Create reflective obsidian ground mirror
const groundGeo = new THREE.CircleGeometry(60, 64);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0814, roughness: 0.1, metalness: 0.95, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
window.scene.add(ground);

// Create living stardust particle field
const stardustCount = 3000;
const stardustGeometry = new THREE.BufferGeometry();
const positions = [];
const colors = [];

for (let i = 0; i < stardustCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = 8 + Math.random() * 32;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions.push(x, y, z);

    // Blend between bioluminescent cyan, sacred lavender, and warm starlight
    const r = (Math.random() * 0.5 + 0.5) * (0x00f0ff >> 16 & 0xff) + (Math.random() * 0.5 + 0.5) * (0xa855f7 >> 16 & 0xff) + (Math.random() * 0.5 + 0.5) * (0xffecd2 >> 16 & 0xff);
    const g = (Math.random() * 0.5 + 0.5) * (0x00f0ff >> 8 & 0xff) + (Math.random() * 0.5 + 0.5) * (0xa855f7 >> 8 & 0xff) + (Math.random() * 0.5 + 0.5) * (0xffecd2 >> 8 & 0xff);
    const b = (Math.random() * 0.5 + 0.5) * (0x00f0ff & 0xff) + (Math.random() * 0.5 + 0.5) * (0xa855f7 & 0xff) + (Math.random() * 0.5 + 0.5) * (0xffecd2 & 0xff);
    colors.push(r / 3, g / 3, b / 3);
}

stardustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
stardustGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

const stardustMaterial = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
const stardust = new THREE.Points(stardustGeometry, stardustMaterial);
window.scene.add(stardust);

// Animation callback for stardust
window.sanctuaryUpdateCallbacks = window.sanctuaryUpdateCallbacks || [];
window.sanctuaryUpdateCallbacks.push((delta, elapsedTime) => {
    const positions = stardust.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] = 2 * Math.sin(elapsedTime * 0.1 + positions[i]) + Math.sin(elapsedTime * 0.05 + positions[i]);
    }
    stardust.geometry.attributes.position.needsUpdate = true;

    stardust.rotation.y += 0.001 * delta;
});