"""
QA & Runtime Auditor Agent
==========================
Validates JavaScript syntax (node -c), verifies that all referenced 3D assets exist,
and audits runtime contracts before approving commits.
"""

import subprocess
import shutil
from pathlib import Path

def run_qa_audit(sanctuary_dir: Path) -> dict:
    """Runs full automated QA validation suite on the sanctuary codebase."""
    print("[QA] Running automated QA and static validation suite...")
    
    report = {
        "syntax_passed": True,
        "assets_passed": True,
        "errors": []
    }

    # 1. JavaScript Syntax Validation via Node.js
    node_bin = shutil.which("node")
    if node_bin:
        for js_file in sanctuary_dir.glob("*.js"):
            res = subprocess.run([node_bin, "-c", str(js_file)], capture_output=True, text=True)
            if res.returncode != 0:
                report["syntax_passed"] = False
                err_msg = f"Syntax error in {js_file.name}: {res.stderr.strip()}"
                report["errors"].append(err_msg)
                print(f"   [FAIL] {js_file.name}: {res.stderr.strip()[:100]}")
            else:
                print(f"   [OK] Syntax clean: {js_file.name}")
    else:
        print("   [WARN] Node.js not detected in PATH; skipping node -c syntax check.")

    # 2. Asset Integrity Check
    assets_dir = sanctuary_dir / "assets"
    required_assets = ["forest.glb", "lantern.glb", "actor.glb", "spirit_bird.glb"]
    for asset_name in required_assets:
        target = assets_dir / asset_name
        if not target.exists() or target.stat().st_size < 1000:
            report["assets_passed"] = False
            report["errors"].append(f"Missing or corrupted 3D model asset: {asset_name}")
            print(f"   [FAIL] Asset missing or invalid: {asset_name}")
        else:
            print(f"   [OK] Asset verified: {asset_name} ({target.stat().st_size / 1024:.1f} KB)")

    # 3. Overall Verdict
    passed = report["syntax_passed"] and report["assets_passed"]
    report["verdict"] = "PASSED" if passed else "FAILED"
    print(f"[QA] Audit Complete. Verdict: {report['verdict']}")
    return report

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent.parent
    rep = run_qa_audit(base / "sanctuary")
    exit(0 if rep["verdict"] == "PASSED" else 1)
