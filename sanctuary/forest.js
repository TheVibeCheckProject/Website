var THREE = window.THREE;

function createMysticalTree(x, z, scale) {
    var geometryTrunk = new THREE.CylinderGeometry(0.2, 0.5, 3, 32);
    var materialTrunk = new THREE.MeshStandardMaterial({
        color: 0x4b3621,
        roughness: 0.7,
        metalness: 0.1
    });
    var trunk = new THREE.Mesh(geometryTrunk, materialTrunk);
    trunk.position.set(x, 1.5, z);
    trunk.scale.set(scale, scale, scale);
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    var geometryFoliage = new THREE.SphereGeometry(1.5, 32, 32);
    var materialFoliage = new THREE.MeshStandardMaterial({
        color: 0x008000,
        emissive: 0x00bfff,
        emissiveIntensity: 0.5,
        roughness: 0.5,
        metalness: 0.05
    });
    var foliage = new THREE.Mesh(geometryFoliage, materialFoliage);
    foliage.position.set(x, 4, z);
    foliage.scale.set(scale, scale, scale);
    foliage.castShadow = true;
    foliage.receiveShadow = true;

    var treeGroup = new THREE.Group();
    treeGroup.add(trunk);
    treeGroup.add(foliage);
    return treeGroup;
}

function createGlowingMushroom(x, z, scale, capColor, lightColor) {
    var geometryStem = new THREE.CylinderGeometry(0.1, 0.15, 1, 32, 1, false);
    var materialStem = new THREE.MeshStandardMaterial({
        color: 0xf0e68c,
        roughness: 0.8,
        metalness: 0.05
    });
    var stem = new THREE.Mesh(geometryStem, materialStem);
    stem.position.set(x, 0.5, z);
    stem.scale.set(scale, scale, scale);
    stem.rotation.x = Math.PI / 4;
    stem.castShadow = true;
    stem.receiveShadow = true;

    var geometryCap = new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    var materialCap = new THREE.MeshStandardMaterial({
        color: capColor,
        emissive: capColor,
        emissiveIntensity: 0.8,
        roughness: 0.7,
        metalness: 0.05
    });
    var cap = new THREE.Mesh(geometryCap, materialCap);
    cap.position.set(x, 1.5, z);
    cap.scale.set(scale, scale, scale);
    cap.castShadow = true;
    cap.receiveShadow = true;

    var mushroomGroup = new THREE.Group();
    mushroomGroup.add(stem);
    mushroomGroup.add(cap);

    if (lightColor) {
        var pointLight = new THREE.PointLight(lightColor, 0.8, 5);
        pointLight.position.set(x, 1.5, z);
        mushroomGroup.add(pointLight);
    }

    return mushroomGroup;
}

function createGlowingCrystalObelisk(x, z) {
    var geometryBase = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    var materialBase = new THREE.MeshStandardMaterial({
        color: 0x800080,
        roughness: 0.5,
        metalness: 0.1
    });
    var base = new THREE.Mesh(geometryBase, materialBase);
    base.position.set(x, 0.5, z);
    base.castShadow = true;
    base.receiveShadow = true;

    var geometryObelisk = new THREE.CylinderGeometry(0.2, 0.2, 2, 32);
    var materialObelisk = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
        roughness: 0.5,
        metalness: 0.1
    });
    var obelisk = new THREE.Mesh(geometryObelisk, materialObelisk);
    obelisk.position.set(x, 2, z);
    obelisk.castShadow = true;
    obelisk.receiveShadow = true;

    var geometryWisp = new THREE.SphereGeometry(0.1, 32, 32);
    var materialWisp = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8,
        roughness: 0.9,
        metalness: 0.05
    });
    var wisp = new THREE.Mesh(geometryWisp, materialWisp);
    wisp.position.set(x + 0.1, 3, z + 0.1);
    wisp.castShadow = true;
    wisp.receiveShadow = true;

    var obeliskGroup = new THREE.Group();
    obeliskGroup.add(base);
    obeliskGroup.add(obelisk);
    obeliskGroup.add(wisp);

    return obeliskGroup;
}

function createForestRelic(x, z) {
    var geometryRelic = new THREE.SphereGeometry(0.5, 32, 32);
    var materialRelic = new THREE.MeshStandardMaterial({
        color: 0x8a2be2,
        emissive: 0x8a2be2,
        emissiveIntensity: 0.8,
        roughness: 0.5,
        metalness: 0.1
    });
    var relic = new THREE.Mesh(geometryRelic, materialRelic);
    relic.position.set(x, 1, z);
    relic.castShadow = true;
    relic.receiveShadow = true;

    relic.interactive = true;
    relic.onPointerOver = function () {
        relic.material.emissiveIntensity = 1.2;
    };
    relic.onPointerOut = function () {
        relic.material.emissiveIntensity = 0.8;
    };
    relic.onClick = function () {
        window.playCrystalChime();
        document.getElementById('relic-modal').style.display = 'block';
    };

    return relic;
}

// Populate the mystical forest with trees
for (var i = 0; i < 40; i++) {
    var angle = Math.random() * Math.PI * 2;
    var radius = 10 + Math.random() * 20;
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    var scale = 0.5 + Math.random();
    var tree = createMysticalTree(x, z, scale);
    window.scene.add(tree);
}

// Populate the mystical forest with glowing mushrooms
for (var i = 0; i < 50; i++) {
    var angle = Math.random() * Math.PI * 2;
    var radius = 5 + Math.random() * 25;
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    var scale = 0.5 + Math.random();
    var capColor = Math.random() > 0.5 ? 0x00f0ff : 0x9b51e0;
    var lightColor = Math.random() > 0.5 ? 0x00f0ff : null;
    var mushroom = createGlowingMushroom(x, z, scale, capColor, lightColor);
    window.scene.add(mushroom);
}

// Load the lantern GLTF model with 404 resilient fallback
var loader = new THREE.GLTFLoader();
loader.load('assets/lantern.glb', function (gltf) {
    var lantern = gltf.scene;
    lantern.position.set(0, 1, 0);
    lantern.scale.set(0.1, 0.1, 0.1);
    lantern.castShadow = true;
    lantern.receiveShadow = true;
    window.scene.add(lantern);
}, undefined, function (error) {
    console.error('An error happened while loading the lantern model:', error);
    var crystalObelisk = createGlowingCrystalObelisk(0, 0);
    window.scene.add(crystalObelisk);
});

// Create interactive forest relics
var relics = [
    createForestRelic(-15, 15),
    createForestRelic(15, 15),
    createForestRelic(-15, -15),
    createForestRelic(15, -15)
];

relics.forEach(function (relic) {
    window.scene.add(relic);
});

// Raycasting interaction for relics
var relicRaycaster = new THREE.Raycaster();
var relicMouse = new THREE.Vector2();

window.addEventListener('pointermove', function(event) {
    relicMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    relicMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (!window.camera) return;
    relicRaycaster.setFromCamera(relicMouse, window.camera);
    relics.forEach(function(relic) {
        if (!relic || !relic.interactive) return;
        var intersects = relicRaycaster.intersectObject(relic, true);
        if (intersects.length > 0) {
            if (relic.onPointerOver) relic.onPointerOver();
            document.body.style.cursor = 'pointer';
        } else {
            if (relic.onPointerOut) relic.onPointerOut();
            document.body.style.cursor = 'default';
        }
    });
});

window.addEventListener('pointerdown', function(event) {
    if (!window.camera) return;
    relicRaycaster.setFromCamera(relicMouse, window.camera);
    relics.forEach(function(relic) {
        if (!relic || !relic.interactive) return;
        var intersects = relicRaycaster.intersectObject(relic, true);
        if (intersects.length > 0 && relic.onClick) {
            relic.onClick();
        }
    });
});