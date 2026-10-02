var THREE = window.THREE;

// Set background and fog
window.scene.background = new THREE.Color(0x040907);
window.scene.fog = new THREE.FogExp2(0x050c09, 0.022);

// Ambient light
var ambientLight = new THREE.AmbientLight(0x0e241e, 0.8);
window.scene.add(ambientLight);

// Directional moonlight
var moonlight = new THREE.DirectionalLight(0xa8e6cf, 1.8);
moonlight.position.set(-20, 35, 15);
moonlight.castShadow = true;
moonlight.shadow.mapSize.width = 2048;
moonlight.shadow.mapSize.height = 2048;
moonlight.shadow.camera.near = 1;
moonlight.shadow.camera.far = 100;
moonlight.shadow.camera.left = -40;
moonlight.shadow.camera.right = 40;
moonlight.shadow.camera.top = 40;
moonlight.shadow.camera.bottom = -40;
window.scene.add(moonlight);

// Bioluminescent Wisps & Fireflies
var fireflyCount = 1500;
var fireflyGeometry = new THREE.BufferGeometry();
var fireflyPositions = [];
var fireflyColors = [];

for (var i = 0; i < fireflyCount; i++) {
    var x = Math.random() * 80 - 40;
    var y = Math.random() * 7.5 + 0.5;
    var z = Math.random() * 80 - 40;
    fireflyPositions.push(x, y, z);

    // Random color blending
    var color = new THREE.Color();
    color.setRGB(
        Math.random() * 0.2 + 0.2, // Green component
        Math.random() * 0.8 + 0.2, // Blue component
        Math.random() * 0.4 + 0.6  // Red component
    );
    fireflyColors.push(color.r, color.g, color.b);
}

fireflyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fireflyPositions, 3));
fireflyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(fireflyColors, 3));

var fireflyMaterial = new THREE.PointsMaterial({
    size: 0.18,
    transparent: true,
    opacity: 0.9,
    vertexColors: true,
    blending: THREE.AdditiveBlending
});

var fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
window.scene.add(fireflies);

// Magical Wisps
var wispCount = 3;
var wisps = [];
var wispColors = [0x00f0ff, 0x8e44ad, 0x2ecc71]; // Cyan, Violet, Emerald

for (var i = 0; i < wispCount; i++) {
    var wispGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    var wispMaterial = new THREE.MeshBasicMaterial({ color: wispColors[i] });
    var wisp = new THREE.Mesh(wispGeometry, wispMaterial);
    wisp.position.set(Math.random() * 80 - 40, Math.random() * 7.5 + 0.5, Math.random() * 80 - 40);

    var wispLight = new THREE.PointLight(wispColors[i], 1, 10);
    wisp.add(wispLight);

    wisps.push({
        mesh: wisp,
        time: Math.random() * Math.PI * 2
    });

    window.scene.add(wisp.mesh);
}

// Animation Callback
function animateAtmosphere(delta) {
    // Fireflies oscillation
    var positions = fireflyGeometry.attributes.position.array;
    for (var i = 0; i < fireflyCount; i++) {
        var y = 0.5 + Math.sin((i + delta * 50) * 0.05) * 3;
        positions[i * 3 + 1] = y;
    }
    fireflyGeometry.attributes.position.needsUpdate = true;

    // Wisps drifting
    for (var i = 0; i < wisps.length; i++) {
        var wisp = wisps[i];
        wisp.time += delta * 0.2;
        var x = 20 * Math.sin(wisp.time);
        var z = 20 * Math.cos(wisp.time);
        var y = 5 + 2 * Math.sin(wisp.time * 0.5);
        wisp.mesh.position.set(x, y, z);
    }
}

window.sanctuaryUpdateCallbacks.push(animateAtmosphere);