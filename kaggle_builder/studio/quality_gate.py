"""
Quality Gate Agent
==================
AST and pattern auditor that enforces the high visual standard:
- Rejects primitive geometric proxies (cylinders, spheres, cubes used as trees/mushrooms/foliage)
- Rejects untextured square point particles
- Enforces GLTF PBR model utilization
- Limits shadow-casting light count to prevent WebGL MAX_TEXTURE_IMAGE_UNITS crash
- Calibrates bloom and tone mapping thresholds
"""

import re
from pathlib import Path

class QualityGateViolation(Exception):
    pass

def audit_file(filepath: Path) -> list:
    """
    Audits a single JavaScript source file for aesthetic and technical violations.
    Returns a list of violations (empty if passed).
    """
    violations = []
    content = filepath.read_text(encoding="utf-8")
    filename = filepath.name

    # Check 1: Primitive Geometric Proxies (trees, mushrooms, bushes)
    # Reject cylinder/sphere combinations representing foliage/trees
    if "forest.js" in filename or "terrain.js" in filename:
        if re.search(r"CylinderGeometry.*foliage|SphereGeometry.*foliage", content, re.IGNORECASE):
            violations.append("Violation: Procedural primitive geometry used for foliage. Must use sourced PBR GLB models.")
        if re.search(r"CylinderGeometry.*trunk", content, re.IGNORECASE):
            violations.append("Violation: Procedural cylinder used for tree trunks. Must use sourced PBR GLB models.")
        if re.search(r"createMysticalTree\s*\(", content) and "SphereGeometry" in content:
            violations.append("Violation: 'createMysticalTree' uses procedural SphereGeometry. Unacceptable toddler-tier geometry.")
        if re.search(r"createGlowingMushroom\s*\(", content) and "SphereGeometry" in content:
            violations.append("Violation: 'createGlowingMushroom' uses procedural SphereGeometry/Cylinder. Must use textured GLTF or remove.")

    # Check 2: Particle Texture Quality
    # In atmosphere.js, PointsMaterial must specify a soft particle map or texture, not bare default square points
    if "atmosphere.js" in filename:
        if "new THREE.Points" in content:
            if "map:" not in content and "THREE.Texture" not in content and "createRadialTexture" not in content:
                violations.append("Violation: Fireflies/wisps rendered as bare untextured square WebGL points. Must use soft circular radial alpha sprite.")

    # Check 3: WebGL Shadow Unit Limits
    # Multiple point lights casting shadows cause FRAGMENT shader texture units > 16 crash
    point_shadow_count = len(re.findall(r"PointLight[^\n]*\n[^\n]*castShadow\s*=\s*true", content))
    if point_shadow_count > 1:
        violations.append(f"Violation: Detected {point_shadow_count} shadow-casting PointLights. WebGL MAX_TEXTURE_IMAGE_UNITS will crash. Limit shadow casting to directional moonlight.")

    # Check 4: UnrealBloom Calibration
    if "world.js" in filename:
        bloom_match = re.search(r"UnrealBloomPass\([^,]+,[^,]+,\s*([0-9.]+)", content)
        if bloom_match:
            strength = float(bloom_match.group(1))
            if strength > 0.8:
                violations.append(f"Violation: Bloom strength is set to {strength} (excessive neon blowout). Must be calibrated to <= 0.6 for cinematic clarity.")

    # Check 5: Tone Mapping
    if "world.js" in filename:
        if "ACESFilmicToneMapping" not in content:
            violations.append("Violation: Missing ACESFilmicToneMapping. Standard tone mapping produces washed-out colors.")

    return violations

def audit_directory(sanctuary_dir: Path) -> dict:
    """Audits all sanctuary modules against the Quality Gate."""
    print("[GATE] Auditing sanctuary modules against the Quality Gate...")
    results = {}
    total_violations = 0
    
    for js_file in sanctuary_dir.glob("*.js"):
        violations = audit_file(js_file)
        results[js_file.name] = violations
        if violations:
            total_violations += len(violations)
            print(f"   [REJECT] {js_file.name}:")
            for v in violations:
                print(f"      - {v}")
        else:
            print(f"   [PASS] {js_file.name}: Quality standards satisfied.")
            
    return {"passed": total_violations == 0, "violations": results}

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent.parent
    report = audit_directory(base / "sanctuary")
    if not report["passed"]:
        print("[GATE] Quality Gate Status: FAILED. Refactoring required.")
        exit(1)
    else:
        print("[GATE] Quality Gate Status: PASSED.")
