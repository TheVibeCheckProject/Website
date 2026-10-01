function createCrystallineObelisk() {
    const geometry = new THREE.BoxGeometry(2, 10, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.8 });
    const obelisk = new THREE.Mesh(geometry, material);
    obelisk.position.set(0, 5, 0);
    return obelisk;
}

function createStarlightRings() {
    const ringGeometry = new THREE.TorusGeometry(5, 0.5, 16, 100);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    return ring;
}

const obelisk = createCrystallineObelisk();
const starlightRings = createStarlightRings();

scene.add(obelisk);
scene.add(starlightRings);