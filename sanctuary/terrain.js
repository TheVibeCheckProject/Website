var THREE = window.THREE;

// Organic Undulating Forest Ground
var terrainSize = 110;
var terrainSegments = 80;
var terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
terrainGeometry.rotateX(-Math.PI / 2);

var pos = terrainGeometry.attributes.position;
for (var i = 0; i < pos.count; i++) {
    var vx = pos.getX(i);
    var vz = pos.getZ(i);
    
    // Perimeter elevation (secluded sanctuary glade in the center)
    var distFromCenter = Math.sqrt(vx * vx + vz * vz);
    var elevation = 0;
    
    if (distFromCenter > 12) {
        var edgeFactor = Math.min((distFromCenter - 12) / 35, 1.0);
        elevation = Math.sin(vx * 0.1) * Math.cos(vz * 0.1) * 2.5 * edgeFactor + (edgeFactor * edgeFactor * 4.0);
    } else {
        // Flat, gentle walkable glade
        elevation = Math.sin(vx * 0.2) * Math.cos(vz * 0.2) * 0.2;
    }
    
    pos.setY(i, elevation);
}

terrainGeometry.computeVertexNormals();

var terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x0c2116,       // Deep enchanted forest moss green
    roughness: 0.9,
    metalness: 0.05,
    flatShading: false
});

var terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrainMesh.receiveShadow = true;
window.scene.add(terrainMesh);
window.terrainMesh = terrainMesh;

// Ground Height Query Function for perfect ground clamping
var raycaster = new THREE.Raycaster();
var downVector = new THREE.Vector3(0, -1, 0);

window.getTerrainHeight = function(x, z) {
    var origin = new THREE.Vector3(x, 40, z);
    raycaster.set(origin, downVector);
    var intersects = raycaster.intersectObject(terrainMesh);
    if (intersects.length > 0) {
        return intersects[0].point.y;
    }
    return 0;
};

// Weathered Sacred Stepping Stone Pathway
var stoneGroup = new THREE.Group();
var stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x22332a,
    roughness: 0.8,
    metalness: 0.1
});

for (var s = -18; s <= 18; s += 2.2) {
    var sx = Math.sin(s * 0.15) * 3.5;
    var sz = s;
    var sy = window.getTerrainHeight(sx, sz) + 0.04;
    
    var stoneRadius = 0.65 + Math.random() * 0.35;
    var stoneGeo = new THREE.CylinderGeometry(stoneRadius, stoneRadius * 1.1, 0.12, 12);
    var stone = new THREE.Mesh(stoneGeo, stoneMaterial);
    stone.position.set(sx, sy, sz);
    stone.rotation.y = Math.random() * Math.PI;
    stone.receiveShadow = true;
    stoneGroup.add(stone);
}
window.scene.add(stoneGroup);
