"""
Executive Supervisor Agent
==========================
Master orchestrator and quality gatekeeper for the Autonomous 3D Studio.
Decomposes goals, routes tasks to specialized workers, enforces aesthetic standards,
and rejects subpar or primitive geometric outputs.
"""

import sys
import subprocess
from pathlib import Path

# Add studio directory to module path
STUDIO_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(STUDIO_DIR))

import asset_scout
import quality_gate
import shading_artist
import engine_architect
import qa_auditor

def run_studio_pipeline(repo_root: Path) -> bool:
    """Executes the complete hierarchical multi-agent build pipeline."""
    print("=" * 75)
    print("[SUPERVISOR] Commencing Autonomous 3D Studio Pipeline...")
    print("=" * 75)

    sanctuary_dir = repo_root / "sanctuary"
    assets_dir = sanctuary_dir / "assets"
    attribution_file = sanctuary_dir / "ATTRIBUTION.md"

    # Step 1: Asset Scout Agent
    print("\n--- Phase 1: Asset Scout Agent Execution ---")
    scout_report = asset_scout.run_scout(assets_dir, attribution_file)
    if scout_report.get("failed_assets"):
        print("[SUPERVISOR] Halting: Asset Scout could not verify all critical 3D assets.")
        return False

    # Step 2: Shading Artist Agent
    print("\n--- Phase 2: Atmosphere & Shading Artist Execution ---")
    shading_artist.apply_shading(sanctuary_dir)

    # Step 3: 3D Engine Architect Agent
    print("\n--- Phase 3: 3D Engine Architect Execution ---")
    engine_architect.apply_architecture(sanctuary_dir)

    # Step 4: Quality Gate Enforcer
    print("\n--- Phase 4: Quality Gate Audit ---")
    gate_report = quality_gate.audit_directory(sanctuary_dir)
    if not gate_report["passed"]:
        print("[SUPERVISOR] REJECTED: Code failed the Quality Gate. Halting pipeline.")
        return False

    # Step 5: QA & Runtime Auditor
    print("\n--- Phase 5: QA & Static Runtime Audit ---")
    qa_report = qa_auditor.run_qa_audit(sanctuary_dir)
    if qa_report["verdict"] != "PASSED":
        print("[SUPERVISOR] REJECTED: QA Auditor detected syntax or integrity failures.")
        return False

    print("\n" + "=" * 75)
    print("[SUPERVISOR] PIPELINE COMPLETED SUCCESSFULLY: High aesthetic standard verified.")
    print("=" * 75)
    return True

if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parent.parent.parent
    success = run_studio_pipeline(repo_root)
    sys.exit(0 if success else 1)
