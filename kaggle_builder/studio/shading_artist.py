"""
Shading Artist Agent
====================
Calibrates lighting, tone mapping, and generates soft circular particle sprites
to eliminate harsh WebGL square points and neon bloom blowout.
"""

from pathlib import Path

def generate_atmosphere_module() -> str:
    """Generates production-grade atmosphere.js with soft radial glowing fireflies and moonlit mist."""
    return """var THREE = window.THREE;

// Set atmospheric background and volumetric depth fog
window.scene.background = new THREE.Color(0x030806);
window.scene.fog = new THREE.FogExp2(0x040c09, 0.024);

// Ambient bounce light (deep forest teal)
var ambientLight = new THREE.AmbientLight(0x0a1e16, 0.9);
window.scene.add(ambientLight);

// Primary directional moonlight (casts soft PCF shadows across the glade)
var moonlight = new THREE.DirectionalLight(0xa3e4d7, 1.6);
moonlight.position.set(-25, 40, 20);
moonlight.castShadow = true;
moonlight.shadow.mapSize.width = 2048;
moonlight.shadow.mapSize.height = 2048;
moonlight.shadow.camera.near = 1;
moonlight.shadow.camera.far = 120;
moonlight.shadow.camera.left = -45;
moonlight.shadow.camera.right = 45;
moonlight.shadow.camera.top = 45;
moonlight.shadow.camera.bottom = -45;
moonlight.shadow.bias = -0.0005;
window.scene.add(moonlight);

// Procedural soft circular radial sprite generator (no raw pixelated square points)
function createRadialTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(0, 240, 200, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 180, 140, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

var fireflyTexture = createRadialTexture();

// Bioluminescent Forest Fireflies (Smooth, glowing circular orbs)
var fireflyCount = 800;
var fireflyGeometry = new THREE.BufferGeometry();
var fireflyPositions = new Float32Array(fireflyCount * 3);
var fireflyInitialY = new Float32Array(fireflyCount);
var fireflySpeeds = new Float32Array(fireflyCount);

for (var i = 0; i < fireflyCount; i++) {
    var angle = Math.random() * Math.PI * 2;
    var dist = 3 + Math.random() * 38;
    var fx = Math.cos(angle) * dist;
    var fz = Math.sin(angle) * dist;
    var fy = 0.4 + Math.random() * 6.5;

    fireflyPositions[i * 3] = fx;
    fireflyPositions[i * 3 + 1] = fy;
    fireflyPositions[i * 3 + 2] = fz;

    fireflyInitialY[i] = fy;
    fireflySpeeds[i] = 0.5 + Math.random() * 1.5;
}

fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));

var fireflyMaterial = new THREE.PointsMaterial({
    size: 0.45,
    map: fireflyTexture,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0x55ffcc
});

var fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
window.scene.add(fireflies);

// Master Atmosphere Animation Frame Loop
if (!window.sanctuaryUpdateCallbacks) window.sanctuaryUpdateCallbacks = [];

window.sanctuaryUpdateCallbacks.push(function(delta, time) {
    // Fireflies gentle organic vertical undulation
    var pos = fireflyGeometry.attributes.position.array;
    for (var i = 0; i < fireflyCount; i++) {
        var idx = i * 3 + 1;
        pos[idx] = fireflyInitialY[i] + Math.sin(time * fireflySpeeds[i] + i) * 0.45;
    }
    fireflyGeometry.attributes.position.needsUpdate = true;
});
"""

def generate_world_module() -> str:
    """Generates calibrated world.js with cinematic bloom (no neon blowout)."""
    return """var THREE = window.THREE;

// Initialize Master Scene
window.scene = new THREE.Scene();

// Initialize Camera
window.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
window.camera.position.set(0, 5, 12);
window.camera.lookAt(0, 1.5, 0);

// Initialize High-Performance WebGL Renderer
window.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
window.renderer.shadowMap.enabled = true;
window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
window.renderer.toneMapping = THREE.ACESFilmicToneMapping;
window.renderer.toneMappingExposure = 1.05;
window.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
window.renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(window.renderer.domElement);

// Initialize Orbit Controls (Free Cam mode)
window.controls = new THREE.OrbitControls(window.camera, window.renderer.domElement);
window.controls.enableDamping = true;
window.controls.dampingFactor = 0.05;
window.controls.maxPolarAngle = Math.PI / 2 - 0.02;
window.controls.minDistance = 3;
window.controls.maxDistance = 60;

// Initialize Postprocessing with Calibrated Ethereal Bloom
// Strength is strictly tuned to 0.45 to prevent blown-out neon lightbulbs
const composer = new THREE.EffectComposer(window.renderer);
composer.addPass(new THREE.RenderPass(window.scene, window.camera));

const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.45,  // Calibrated bloom strength (cinematic ethereal glow)
    0.4,   // Radius
    0.7    // Threshold (only intense emissives glow)
);
composer.addPass(bloomPass);
composer.setSize(window.innerWidth, window.innerHeight);
window.composer = composer;

// Master Animation Loop
window.sanctuaryUpdateCallbacks = [];
let prevTime = performance.now();

function animate(now) {
    requestAnimationFrame(animate);
    const delta = Math.min((now - prevTime) * 0.001, 0.1);
    prevTime = now;
    
    for (const cb of window.sanctuaryUpdateCallbacks) {
        try { cb(delta, now * 0.001); } catch (e) { console.error('Sanctuary update error:', e); }
    }
    
    if (window.playerFollowCamera) {
        // Player camera follow takes precedence
    } else {
        window.controls.update();
    }
    
    composer.render();
}

animate(performance.now());

// Responsive Resize Listener
window.addEventListener('resize', function() {
    window.camera.aspect = window.innerWidth / window.innerHeight;
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
"""

def apply_shading(sanctuary_dir: Path):
    """Writes the calibrated atmosphere and world modules to the sanctuary."""
    print("[ARTIST] Calibrating atmosphere and world postprocessing...")
    (sanctuary_dir / "atmosphere.js").write_text(generate_atmosphere_module(), encoding="utf-8")
    (sanctuary_dir / "world.js").write_text(generate_world_module(), encoding="utf-8")
    print("   [OK] atmosphere.js (soft radial firefly sprites + shadow moonlight) written.")
    print("   [OK] world.js (calibrated bloom + ACESFilmic tone mapping) written.")

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent.parent
    apply_shading(base / "sanctuary")
