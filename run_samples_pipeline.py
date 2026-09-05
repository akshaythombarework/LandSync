#!/usr/bin/env python3
"""
run_samples_pipeline.py
=======================

Standalone script that runs all 4 sample documents through the full
NovaaX OCR + Extraction + Validation pipeline offline (no Supabase required).

Usage (from the NovaaX/ root):
    $env:PYTHONPATH = "backend"
    $env:PYTHONIOENCODING = "utf-8"
    backend\\venv\\Scripts\\python run_samples_pipeline.py

    # Force mock providers (fast, no GPU needed):
    $env:OCR_PROVIDER = "mock"
    backend\\venv\\Scripts\\python run_samples_pipeline.py

Each document result is printed as a formatted summary table and the
overall pass/fail matrix is shown at the end.

Exit codes:
    0 – all documents processed (even if some need review)
    1 – one or more documents failed with an exception
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict

# ---------------------------------------------------------------------------
# Ensure project root is importable
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).parent
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Reconfigure stdout for Windows UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ---------------------------------------------------------------------------
# Logging setup – concise for CLI use
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.WARNING,
    format="%(levelname)s  %(name)s  %(message)s",
)
# Show our own pipeline logs at INFO
for pkg in ("novaax.extraction", "novaax.processing"):
    logging.getLogger(pkg).setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Locate sample documents
# ---------------------------------------------------------------------------
SAMPLE_DIR = REPO_ROOT / "sample-data" / "documents"
SAMPLE_DOCS = [
    {
        "filename": "sample_english.jpg",
        "document_id": "demo-en-001",
        "mime_type": "image/jpeg",
        "expected_language": "en",
        "description": "English 7/12 Extract (Maharashtra)",
    },
    {
        "filename": "sample_hindi.jpg",
        "document_id": "demo-hi-001",
        "mime_type": "image/jpeg",
        "expected_language": "hi",
        "description": "Hindi Khatauni Extract (Uttar Pradesh)",
    },
    {
        "filename": "sample_marathi.png",
        "document_id": "demo-mr-001",
        "mime_type": "image/png",
        "expected_language": "mr",
        "description": "Marathi Satbara Extract (Maharashtra)",
    },
    {
        "filename": "sample_handwritten.jpg",
        "document_id": "demo-hw-001",
        "mime_type": "image/jpeg",
        "expected_language": "en",
        "description": "Handwritten Land Record → triggers human review",
    },
]

# ---------------------------------------------------------------------------
# Minimal offline pipeline (bypasses Supabase DB calls)
# ---------------------------------------------------------------------------
async def run_offline_pipeline(
    doc: Dict[str, Any],
    ocr_provider,
    extraction_provider,
) -> Dict[str, Any]:
    """
    Runs OCR → Extraction → Validation for one document, offline.
    Returns a result dict with all field data + metadata.
    """
    from app.validation.service import ValidationService

    file_path = SAMPLE_DIR / doc["filename"]
    if not file_path.exists():
        raise FileNotFoundError(f"Sample file not found: {file_path}")

    # --- OCR ---
    t0 = time.time()
    ocr_result = await ocr_provider.extract_text(
        document_id=doc["document_id"],
        storage_path=str(file_path),
        mime_type=doc["mime_type"],
        image_source=str(file_path),
    )
    ocr_elapsed = time.time() - t0

    # --- Extraction ---
    t1 = time.time()
    extracted = await extraction_provider.extract_fields(ocr_result)
    ext_elapsed = time.time() - t1

    # --- Validation (rule engine, offline) ---
    t2 = time.time()
    field_items = [
        {"field_name": k, "confidence": v}
        for k, v in extracted.get("field_confidences", {}).items()
    ]
    validation_result = await ValidationService.validate_record(
        record_id=doc["document_id"],
        record_data=extracted,
        fields=field_items,
    )
    val_elapsed = time.time() - t2

    # Group errors / warnings for display
    errors = [r["message"] for r in validation_result.get("results", []) if r.get("severity") in ("ERROR", "CRITICAL")]
    warnings = [r["message"] for r in validation_result.get("results", []) if r.get("severity") == "WARNING"]
    validation_result["errors"] = errors
    validation_result["warnings"] = warnings

    return {
        "doc_meta": doc,
        "ocr_result": {
            "engine": ocr_result.get("ocr_engine"),
            "language": ocr_result.get("language"),
            "avg_confidence": ocr_result.get("confidence"),
            "block_count": ocr_result.get("block_count", len(ocr_result.get("blocks", []))),
            "is_handwritten": ocr_result.get("is_handwritten", False),
            "elapsed_s": round(ocr_elapsed, 2),
        },
        "extraction": extracted,
        "validation": validation_result,
        "timings": {
            "ocr_s": round(ocr_elapsed, 2),
            "extraction_s": round(ext_elapsed, 2),
            "validation_s": round(val_elapsed, 2),
            "total_s": round(ocr_elapsed + ext_elapsed + val_elapsed, 2),
        },
    }


# ---------------------------------------------------------------------------
# Helpers for pretty printing
# ---------------------------------------------------------------------------
FIELDS_TO_SHOW = [
    "landowner_name", "survey_number", "khata_number", "khasra_number",
    "plot_area", "village", "tehsil", "district", "state",
    "land_classification", "ownership_type", "mutation_information",
    "registration_information",
]

CONF_HIGH = 0.88
CONF_MED = 0.70


def _conf_badge(conf: float) -> str:
    if conf >= CONF_HIGH:
        return "✅ HIGH"
    elif conf >= CONF_MED:
        return "⚠️  MED"
    elif conf > 0:
        return "🔴 LOW"
    return "—  n/a"


def _print_result(result: Dict[str, Any]) -> bool:
    """Print a single document result. Returns True if error-free."""
    meta = result["doc_meta"]
    ocr = result["ocr_result"]
    ext = result["extraction"]
    val = result["validation"]
    t = result["timings"]

    title = f"  {meta['filename']}  —  {meta['description']}  "
    bar = "─" * max(len(title), 68)
    print(f"\n╔{bar}╗")
    print(f"│{title.center(len(bar))}│")
    print(f"╚{bar}╝")

    # OCR summary
    hw_flag = " 🖊 HANDWRITTEN" if ocr["is_handwritten"] else ""
    print(f"  OCR Engine     : {ocr['engine']}{hw_flag}")
    print(f"  Detected Lang  : {ocr['language']}")
    print(f"  Avg Confidence : {ocr['avg_confidence']:.2%}   Blocks: {ocr['block_count']}")
    print(f"  Timing         : OCR {ocr['elapsed_s']}s | Ext {t['extraction_s']}s | Val {t['validation_s']}s | Total {t['total_s']}s")

    # Needs review?
    needs_review = ext.get("needs_human_review", False) or val.get("needs_human_review", False)
    review_flag = "  🔁 ROUTED TO HUMAN REVIEW" if needs_review else "  ✅ Auto-processable"
    print(review_flag)

    # Field table
    confidences = ext.get("field_confidences", {})
    print(f"\n  {'Field':<30} {'Value':<38} {'Confidence'}")
    print(f"  {'─'*30} {'─'*38} {'─'*10}")
    for field in FIELDS_TO_SHOW:
        val_raw = ext.get(field)
        val_str = str(val_raw) if val_raw is not None else "(not extracted)"
        val_display = val_str[:36] + ".." if len(val_str) > 36 else val_str
        conf = confidences.get(field, 0.0)
        badge = _conf_badge(conf) if val_raw is not None else "—  n/a"
        conf_str = f"{conf:.0%}" if val_raw is not None else "   —"
        print(f"  {field:<30} {val_display:<38} {badge} ({conf_str})")

    # Validation issues
    val_errors = val.get("errors", [])
    val_warnings = val.get("warnings", [])
    if val_errors:
        print(f"\n  ❌ Validation Errors ({len(val_errors)}):")
        for e in val_errors[:5]:
            print(f"     • {e}")
    if val_warnings:
        print(f"\n  ⚠️  Validation Warnings ({len(val_warnings)}):")
        for w in val_warnings[:5]:
            print(f"     • {w}")

    return True


# ---------------------------------------------------------------------------
# Main entry-point
# ---------------------------------------------------------------------------
async def main() -> int:
    # Determine provider strategy
    use_mock = os.environ.get("OCR_PROVIDER", "easyocr").lower() == "mock"

    if use_mock:
        print("🔧  Using MOCK providers (OCR_PROVIDER=mock)")
        from app.processing.pipeline import MockOCRProvider, MockExtractionProvider
        ocr_prov = MockOCRProvider()
        ext_prov = MockExtractionProvider()
    else:
        print("🔬  Using REAL EasyOCR + RuleNLP providers (initialising…)")
        try:
            from app.extraction.ocr_provider import EasyOCRProvider
            from app.extraction.extraction_provider import RuleNLPExtractionProvider
            ocr_prov = EasyOCRProvider(languages=["en", "hi", "mr"], gpu=False)
            ext_prov = RuleNLPExtractionProvider()
        except ImportError as exc:
            print(f"⚠️  Cannot import real providers ({exc}). Falling back to mock.")
            from app.processing.pipeline import MockOCRProvider, MockExtractionProvider
            ocr_prov = MockOCRProvider()
            ext_prov = MockExtractionProvider()

    print(f"\n{'═'*70}")
    print(f"  NovaaX — OCR + Extraction Sample Pipeline Runner")
    print(f"  Documents: {SAMPLE_DIR}")
    print(f"{'═'*70}")

    results_summary = []
    all_ok = True

    for doc in SAMPLE_DOCS:
        print(f"\n⏳  Processing: {doc['filename']} …", flush=True)
        try:
            result = await run_offline_pipeline(doc, ocr_prov, ext_prov)
            _print_result(result)
            extracted = result["extraction"]
            filled = sum(1 for f in FIELDS_TO_SHOW if result["extraction"].get(f))
            results_summary.append({
                "file": doc["filename"],
                "status": "✅",
                "fields_filled": filled,
                "total_fields": len(FIELDS_TO_SHOW),
                "needs_review": extracted.get("needs_human_review", False),
                "lang": result["ocr_result"]["language"],
                "time_s": result["timings"]["total_s"],
            })
        except Exception as exc:
            import traceback
            print(f"\n  ❌  FAILED: {exc}")
            traceback.print_exc()
            results_summary.append({
                "file": doc["filename"],
                "status": "❌ ERROR",
                "error": str(exc),
            })
            all_ok = False

    # Final summary table
    print(f"\n{'═'*70}")
    print("  SUMMARY")
    print(f"{'═'*70}")
    print(f"  {'File':<30} {'Status':<8} {'Fields':<10} {'Review?':<10} {'Lang':<5} {'Time'}")
    print(f"  {'─'*30} {'─'*8} {'─'*10} {'─'*10} {'─'*5} {'─'*8}")
    for s in results_summary:
        if "error" in s:
            print(f"  {s['file']:<30} {s['status']:<8} —          —          —    ERROR")
        else:
            fields_pct = f"{s['fields_filled']}/{s['total_fields']}"
            review = "🔁 YES" if s.get("needs_review") else "auto"
            print(f"  {s['file']:<30} {s['status']:<8} {fields_pct:<10} {review:<10} {s['lang']:<5} {s['time_s']:.1f}s")
    print(f"{'═'*70}\n")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
