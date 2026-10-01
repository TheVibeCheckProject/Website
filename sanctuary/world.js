document.addEventListener('DOMContentLoaded', () => {
    window.scene = new THREE.Scene();
    const scene = window.scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Ambient and directional lighting for monuments
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    dirLight.position.set(5, 12, 7);
    scene.add(dirLight);

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.3, metalness: 0.4 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(-3.5, 2.5, 0);
    scene.add(cube);

    camera.position.set(0, 4, 12);
    camera.lookAt(0, 3, 0);

    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});