document.addEventListener('DOMContentLoaded', () => {
    function createCrystallineObelisk() {
        const geometry = new THREE.BoxGeometry(1.5, 8, 1.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x9b51e0,
            roughness: 0.2,
            metalness: 0.8
        });
        const obelisk = new THREE.Mesh(geometry, material);
        obelisk.position.set(0, 4, 0);
        return obelisk;
    }

    function createStarlightRings() {
        const ringGeometry = new THREE.TorusGeometry(3.5, 0.15, 16, 100);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x005577,
            roughness: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(0, 4, 0);
        ring.rotation.x = Math.PI / 3;
        return ring;
    }

    if (window.scene) {
        const obelisk = createCrystallineObelisk();
        const ring = createStarlightRings();
        window.scene.add(obelisk);
        window.scene.add(ring);

        // Animate ring rotation
        function animateMonuments() {
            requestAnimationFrame(animateMonuments);
            ring.rotation.z += 0.015;
            obelisk.rotation.y += 0.005;
        }
        animateMonuments();
    }
});