var THREE = window.THREE;

// Function to generate a simple Perlin noise value
function perlinNoise(x, y) {
    var X = Math.floor(x), Y = Math.floor(y);
    x -= X; y -= Y;
    var u = fade(x), v = fade(y);

    var n00 = grad(P[X & 255] + P[Y & 255], x, y);
    var n01 = grad(P[X & 255] + P[Y+1 & 255], x, y-1);
    var n10 = grad(P[X+1 & 255] + P[Y & 255], x-1, y);
    var n11 = grad(P[X+1 & 255] + P[Y+1 & 255], x-1, y-1);

    return lerp(lerp(n00, n01, u), lerp(n10, n11, u), v);
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y) {
    var h = hash & 7;
    var u = h < 4 ? x : y;
    var v = h < 4 ? y : h == 12 || h == 14 ? x : 0;
    return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
}

var P = [];
for (var i = 0; i < 256; i++) { P[i] = Math.floor(Math.random()*256); }
for (var i = 0; i < 256; i++) { P[256 + i] = P[i]; }

// Create the terrain geometry
var terrainGeometry = new THREE.PlaneGeometry(100, 100, 64, 64);
var vertices = terrainGeometry.attributes.position.array;

for (var i = 0; i < vertices.length; i += 3) {
    var x = vertices[i];
    var z = vertices[i + 2];
    var noiseValue = perlinNoise(x / 10, z / 10) * 5 + Math.sin(x / 10) * Math.cos(z / 10) * 2;
    vertices[i + 1] = noiseValue;
}

// Create the terrain material
var terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1c12,
    roughness: 0.85,
    metalness: 0.1
});

// Create the terrain mesh
var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
window.scene.add(terrain);

// Store the terrain height helper function
window.getTerrainHeight = function(x, z) {
    var terrainPosition = terrain.localToWorld(new THREE.Vector3(x, 0, z));
    var raycaster = new THREE.Raycaster(terrainPosition, new THREE.Vector3(0, -1, 0));
    var intersects = raycaster.intersectObject(terrain);
    if (intersects.length > 0) {
        return intersects[0].point.y;
    }
    return 0;
};

// Create the sacred stone pathway
var stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x4b4b4b,
    roughness: 0.9,
    metalness: 0.05
});

var pathPoints = [
    new THREE.Vector3(-50, 0, 0),
    new THREE.Vector3(-40, 0, 5),
    new THREE.Vector3(-30, 0, 15),
    new THREE.Vector3(-20, 0, 25),
    new THREE.Vector3(-10, 0, 35),
    new THREE.Vector3(0, 0, 45),
    new THREE.Vector3(10, 0, 55),
    new THREE.Vector3(20, 0, 65),
    new THREE.Vector3(30, 0, 75)
];

for (var i = 0; i < pathPoints.length - 1; i++) {
    var start = pathPoints[i];
    var end = pathPoints[i + 1];
    var direction = new THREE.Vector3().subVectors(end, start).normalize();
    var distance = start.distanceTo(end);
    var steps = Math.ceil(distance / 2);

    for (var j = 0; j < steps; j++) {
        var stepPosition = new THREE.Vector3().copy(start).add(direction.clone().multiplyScalar(j * 2));
        var stepHeight = window.getTerrainHeight(stepPosition.x, stepPosition.z);
        var step = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 8), stoneMaterial);
        step.position.set(stepPosition.x, stepHeight + 0.1, stepPosition.z);
        step.rotation.y = Math.random() * Math.PI * 2;
        step.castShadow = true;
        step.receiveShadow = true;
        window.scene.add(step);
    }
}