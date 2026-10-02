"""
3D Engine Architect Agent
=========================
Assembles the complete Three.js scene utilizing real PBR GLTF models (KayKit forest pack,
PBR shrine lantern, animated spirit wildlife, and rigged controllable actor).
Purges all toddler-tier primitive proxies in favor of professionally modeled assets.
"""

from pathlib import Path

def generate_terrain_module() -> str:
    """Generates organic undulating terrain with height query and stone path."""
    return """var THREE = window.THREE;

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
"""

def generate_forest_module() -> str:
    """Generates forest.js utilizing real GLTF models from forest.glb and lantern.glb."""
    return """var THREE = window.THREE;

var gltfLoader = new THREE.GLTFLoader();

// Load the KayKit Forest Nature Pack (Real PBR Trees, Boulders, Mossy Rocks, and Bushes)
gltfLoader.load('assets/forest.glb', function(gltf) {
    console.log('[Forest] Sourced 3D Nature Pack loaded successfully.');
    
    var models = {};
    gltf.scene.traverse(function(child) {
        if (child.isMesh && child.name) {
            models[child.name] = child;
        }
    });

    var treeKeys = Object.keys(models).filter(function(k) { return k.toLowerCase().indexOf('tree') !== -1; });
    var rockKeys = Object.keys(models).filter(function(k) { return k.toLowerCase().indexOf('rock') !== -1; });
    var bushKeys = Object.keys(models).filter(function(k) { return k.toLowerCase().indexOf('bush') !== -1 || k.toLowerCase().indexOf('grass') !== -1; });

    console.log('[Forest] Catalogued assets:', {
        trees: treeKeys.length,
        rocks: rockKeys.length,
        flora: bushKeys.length
    });

    var forestGroup = new THREE.Group();

    // 1. Populate Natural Forest Perimeter with Real 3D Trees (35+ trees)
    var numTrees = 45;
    for (var i = 0; i < numTrees; i++) {
        var angle = Math.random() * Math.PI * 2;
        var radius = 13 + Math.random() * 32;
        var tx = Math.cos(angle) * radius;
        var tz = Math.sin(angle) * radius;
        var ty = window.getTerrainHeight ? window.getTerrainHeight(tx, tz) : 0;

        var treeKey = treeKeys[i % treeKeys.length];
        var treeTemplate = models[treeKey];
        if (treeTemplate) {
            var tree = treeTemplate.clone();
            var scale = 1.8 + Math.random() * 1.6;
            tree.scale.set(scale, scale, scale);
            tree.position.set(tx, ty, tz);
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.castShadow = true;
            tree.receiveShadow = true;
            forestGroup.add(tree);
        }
    }

    // 2. Populate Mossy Boulders & Sacred Rocks (25+ boulders)
    var numRocks = 30;
    for (var r = 0; r < numRocks; r++) {
        var rAngle = Math.random() * Math.PI * 2;
        var rDist = 6 + Math.random() * 30;
        var rx = Math.cos(rAngle) * rDist;
        var rz = Math.sin(rAngle) * rDist;
        var ry = window.getTerrainHeight ? window.getTerrainHeight(rx, rz) : 0;

        var rockKey = rockKeys[r % rockKeys.length];
        var rockTemplate = models[rockKey];
        if (rockTemplate) {
            var rock = rockTemplate.clone();
            var rScale = 1.2 + Math.random() * 1.5;
            rock.scale.set(rScale, rScale, rScale);
            rock.position.set(rx, ry - 0.2, rz);
            rock.rotation.set(Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.3);
            rock.castShadow = true;
            rock.receiveShadow = true;
            forestGroup.add(rock);
        }
    }

    // 3. Populate Natural Foliage & Grass Tufts (50+ bushes)
    var numFlora = 55;
    for (var f = 0; f < numFlora; f++) {
        var fAngle = Math.random() * Math.PI * 2;
        var fDist = 4 + Math.random() * 28;
        var fx = Math.cos(fAngle) * fDist;
        var fz = Math.sin(fAngle) * fDist;
        var fy = window.getTerrainHeight ? window.getTerrainHeight(fx, fz) : 0;

        var bushKey = bushKeys[f % bushKeys.length];
        var bushTemplate = models[bushKey];
        if (bushTemplate) {
            var bush = bushTemplate.clone();
            var bScale = 0.8 + Math.random() * 0.8;
            bush.scale.set(bScale, bScale, bScale);
            bush.position.set(fx, fy, fz);
            bush.rotation.y = Math.random() * Math.PI * 2;
            bush.receiveShadow = true;
            forestGroup.add(bush);
        }
    }

    window.scene.add(forestGroup);
}, undefined, function(err) {
    console.error('[Forest] Failed to load forest.glb:', err);
});

// Load the Central Sacred Shrine Lantern (PBR GLTF)
gltfLoader.load('assets/lantern.glb', function(gltf) {
    var lantern = gltf.scene;
    var ly = window.getTerrainHeight ? window.getTerrainHeight(0, 0) : 0;
    lantern.position.set(0, ly, 0);
    lantern.scale.set(0.12, 0.12, 0.12);
    lantern.castShadow = true;
    lantern.receiveShadow = true;
    window.scene.add(lantern);

    // Subtle warm inner shrine lantern glow (non-shadow casting for WebGL safety)
    var shrineLight = new THREE.PointLight(0xffb347, 1.2, 8);
    shrineLight.position.set(0, ly + 1.2, 0);
    window.scene.add(shrineLight);
}, undefined, function(err) {
    console.error('[Forest] Failed to load lantern.glb:', err);
});

// Load Spirit Wildlife (Flamingo / Ethereal Bird) circling in the canopy
gltfLoader.load('assets/spirit_bird.glb', function(gltf) {
    var bird = gltf.scene;
    bird.scale.set(0.015, 0.015, 0.015);
    window.scene.add(bird);

    var mixer = new THREE.AnimationMixer(bird);
    if (gltf.animations && gltf.animations.length > 0) {
        var action = mixer.clipAction(gltf.animations[0]);
        action.play();
    }

    var birdAngle = 0;
    if (window.sanctuaryUpdateCallbacks) {
        window.sanctuaryUpdateCallbacks.push(function(delta, time) {
            mixer.update(delta);
            birdAngle += delta * 0.35;
            var bx = Math.cos(birdAngle) * 16;
            var bz = Math.sin(birdAngle) * 16;
            bird.position.set(bx, 10 + Math.sin(time * 1.5) * 1.2, bz);
            bird.rotation.y = -birdAngle + Math.PI / 2;
        });
    }
}, undefined, function(err) {
    console.error('[Forest] Failed to load spirit_bird.glb:', err);
});

// Interactive Sacred Monolith Relics (North, South, East, West)
var relics = [];
var relicLocations = [
    { name: "Monolith of Stillness", x: 0, z: -15, quote: "Silence is the sanctuary of the mind." },
    { name: "Monolith of Wonder", x: 15, z: 0, quote: "To marvel is to open the eye of the soul." },
    { name: "Monolith of Harmony", x: 0, z: 15, quote: "Order and chaos dance in eternal rhythm." },
    { name: "Monolith of Presence", x: -15, z: 0, quote: "The eternal present holds all that ever was." }
];

var relicMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b2820,
    emissive: 0x00f0bb,
    emissiveIntensity: 0.3,
    roughness: 0.6,
    metalness: 0.2
});

relicLocations.forEach(function(loc) {
    var ry = window.getTerrainHeight ? window.getTerrainHeight(loc.x, loc.z) : 0;
    var baseGeo = new THREE.BoxGeometry(0.8, 2.2, 0.5);
    var mesh = new THREE.Mesh(baseGeo, relicMaterial.clone());
    mesh.position.set(loc.x, ry + 1.1, loc.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.userData = {
        name: loc.name,
        quote: loc.quote,
        baseIntensity: 0.3
    };

    relics.push(mesh);
    window.scene.add(mesh);
});

// Interactive Raycaster for Relics
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

window.addEventListener('pointermove', function(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (!window.camera) return;
    raycaster.setFromCamera(mouse, window.camera);
    var intersects = raycaster.intersectObjects(relics);
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        intersects[0].object.material.emissiveIntensity = 0.9;
    } else {
        document.body.style.cursor = 'default';
        relics.forEach(function(r) { r.material.emissiveIntensity = r.userData.baseIntensity; });
    }
});

window.addEventListener('pointerdown', function(e) {
    if (!window.camera) return;
    raycaster.setFromCamera(mouse, window.camera);
    var intersects = raycaster.intersectObjects(relics);
    if (intersects.length > 0) {
        var relicData = intersects[0].object.userData;
        if (window.playCrystalChime) window.playCrystalChime();
        var modal = document.getElementById('relic-modal');
        var title = document.getElementById('relic-title');
        var quote = document.getElementById('relic-quote');
        if (modal && title && quote) {
            title.textContent = relicData.name;
            quote.textContent = relicData.quote;
            modal.classList.add('active');
        }
    }
});
"""

def generate_player_module() -> str:
    """Generates player.js utilizing actor.glb (rigged Fox spirit wanderer)."""
    return """var THREE = window.THREE;

var playerPosition = new THREE.Vector3(0, 0, 8);
var playerVelocity = new THREE.Vector3();
var playerSpeed = 8.0;
var playerRotation = 0;
var targetRotation = 0;
var isMoving = false;

var keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', function(e) {
    if (keys.hasOwnProperty(e.key)) { keys[e.key] = true; }
});
window.addEventListener('keyup', function(e) {
    if (keys.hasOwnProperty(e.key)) { keys[e.key] = false; }
});

var playerContainer = new THREE.Group();
playerContainer.position.copy(playerPosition);
window.scene.add(playerContainer);

var playerMixer = null;
var walkAction = null;
var idleAction = null;

// Load Rigged Spirit Wanderer (Fox)
var gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('assets/actor.glb', function(gltf) {
    var actorModel = gltf.scene;
    actorModel.scale.set(0.02, 0.02, 0.02);
    actorModel.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    playerContainer.add(actorModel);

    // Setup animations
    if (gltf.animations && gltf.animations.length > 0) {
        playerMixer = new THREE.AnimationMixer(actorModel);
        // Common clip names: Survey, Walk, Run
        idleAction = playerMixer.clipAction(gltf.animations[0]);
        idleAction.play();
        if (gltf.animations.length > 1) {
            walkAction = playerMixer.clipAction(gltf.animations[1] || gltf.animations[2]);
        }
    }
    console.log('[Player] Controllable 3D Spirit Wanderer loaded.');
}, undefined, function(err) {
    console.error('[Player] Failed to load actor.glb:', err);
});

// Camera Follow System
var cameraOffset = new THREE.Vector3(0, 3.5, 6.5);
window.playerFollowCamera = true;

// Player Movement & Frame Loop
if (window.sanctuaryUpdateCallbacks) {
    window.sanctuaryUpdateCallbacks.push(function(delta, time) {
        var forward = (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0);
        var strafe = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0);
        
        isMoving = (forward !== 0 || strafe !== 0);

        if (isMoving) {
            var moveAngle = Math.atan2(strafe, forward);
            targetRotation = moveAngle;
            
            var moveDir = new THREE.Vector3(strafe, 0, -forward).normalize();
            playerPosition.x += moveDir.x * playerSpeed * delta;
            playerPosition.z += moveDir.z * playerSpeed * delta;

            // Clamping inside the sanctuary bounds
            var dist = Math.sqrt(playerPosition.x * playerPosition.x + playerPosition.z * playerPosition.z);
            if (dist > 38) {
                playerPosition.x = (playerPosition.x / dist) * 38;
                playerPosition.z = (playerPosition.z / dist) * 38;
            }
        }

        // Smooth rotation interpolation
        playerRotation += (targetRotation - playerRotation) * 0.15;
        playerContainer.rotation.y = playerRotation;

        // Ground Height Tracking
        var groundY = window.getTerrainHeight ? window.getTerrainHeight(playerPosition.x, playerPosition.z) : 0;
        playerPosition.y = groundY;
        playerContainer.position.copy(playerPosition);

        // Update animation mixer
        if (playerMixer) {
            playerMixer.update(delta * (isMoving ? 1.4 : 0.8));
        }

        // Camera Follow
        if (window.camera) {
            var desiredCameraPos = new THREE.Vector3(
                playerPosition.x - Math.sin(playerRotation * 0.3) * 2,
                playerPosition.y + cameraOffset.y,
                playerPosition.z + cameraOffset.z
            );
            window.camera.position.lerp(desiredCameraPos, 0.08);
            var lookAtTarget = playerPosition.clone().add(new THREE.Vector3(0, 1.2, 0));
            window.camera.lookAt(lookAtTarget);
        }
    });
}
"""

def apply_architecture(sanctuary_dir: Path):
    """Writes terrain.js, forest.js, and player.js to the sanctuary."""
    print("[ARCHITECT] Generating clean 3D scene modules with sourced PBR assets...")
    (sanctuary_dir / "terrain.js").write_text(generate_terrain_module(), encoding="utf-8")
    (sanctuary_dir / "forest.js").write_text(generate_forest_module(), encoding="utf-8")
    (sanctuary_dir / "player.js").write_text(generate_player_module(), encoding="utf-8")
    print("   [OK] terrain.js (organic undulating heightmap + stone path) written.")
    print("   [OK] forest.js (real KayKit trees, rocks, flora, PBR lantern, wildlife) written.")
    print("   [OK] player.js (controllable 3D Fox spirit wanderer + follow cam) written.")

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent.parent
    apply_architecture(base / "sanctuary")
