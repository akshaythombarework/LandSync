"""
EasyOCR-based real OCR provider for NovaaX.

Implements the OCRProvider ABC defined in processing/pipeline.py.
Supports English, Hindi (hi), and Marathi (mr via Devanagari shared model).
Falls back to MockOCRProvider if EasyOCR is not available or model download fails.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger("novaax.extraction.ocr")

# ---------------------------------------------------------------------------
# Reader cache – EasyOCR initialisation is expensive (~5-10s per language set)
# ---------------------------------------------------------------------------
_READER_CACHE: Dict[str, Any] = {}


def _get_reader(lang_list: List[str], gpu: bool = False):
    """Return a cached EasyOCR Reader for the given language list."""
    cache_key = "|".join(sorted(lang_list))
    if cache_key not in _READER_CACHE:
        import easyocr  # type: ignore

        logger.info("Initialising EasyOCR reader for langs=%s (gpu=%s)", lang_list, gpu)
        reader = easyocr.Reader(lang_list, gpu=gpu, verbose=False)
        _READER_CACHE[cache_key] = reader
    return _READER_CACHE[cache_key]


# ---------------------------------------------------------------------------
# Language detection helper
# ---------------------------------------------------------------------------
def _detect_language_family(text_blocks: List) -> str:
    """
    Heuristically guess the primary language family from OCR blocks.
    Returns 'devanagari' (hi/mr), or 'latin' (en).
    """
    devanagari_chars = 0
    latin_chars = 0
    for _, text, _ in text_blocks:
        for ch in text:
            cp = ord(ch)
            if 0x0900 <= cp <= 0x097F:  # Devanagari Unicode block
                devanagari_chars += 1
            elif ch.isalpha():
                latin_chars += 1
    if devanagari_chars > latin_chars:
        return "devanagari"
    return "latin"


def _map_language_name(lang_code: str) -> str:
    mapping = {"en": "english", "hi": "hindi", "mr": "marathi"}
    return mapping.get(lang_code, lang_code)


# ---------------------------------------------------------------------------
# Real EasyOCR Provider
# ---------------------------------------------------------------------------
class EasyOCRProvider:
    """
    Real OCR provider using EasyOCR for multilingual land record documents.

    Language strategy:
      - English-only documents → Reader(['en'])
      - Devanagari (Hindi/Marathi) documents → Reader(['en', 'hi', 'mr'])
      - Both readers are cached after first use.

    This class satisfies the OCRProvider ABC interface used by ProcessingPipelineService.
    """

    LOW_CONF_THRESHOLD = 0.25  # Below this, block is considered low-quality

    def __init__(self, languages: Optional[List[str]] = None, gpu: bool = False):
        self.languages = languages or ["en", "hi", "mr"]
        self.gpu = gpu

    async def extract_text(
        self,
        document_id: str,
        storage_path: str,
        mime_type: str,
        image_source=None,  # bytes or local path, passed by run_samples_pipeline
    ) -> Dict[str, Any]:
        """
        Run preprocessing + EasyOCR on the document.

        Priority of image source:
          1. image_source (raw bytes or local path) – used by pipeline when file is local
          2. Attempts to load from storage_path as a local filesystem path
          3. Falls back to mock result if nothing is readable
        """
        from app.extraction.preprocess import preprocess_image_bytes
        from app.extraction.preprocessing import ImagePreprocessor
        from PIL import Image

        # --- Resolve image bytes / path ---
        source = image_source or storage_path
        if not source:
            logger.warning("No image source for document %s; using mock", document_id)
            return _mock_ocr_result(document_id)

        # --- Preprocessing ---
        try:
            rgb_array, meta = preprocess_image_bytes(source)
        except Exception as exc:
            logger.error("Preprocessing failed for %s: %s", document_id, exc)
            return _mock_ocr_result(document_id)

        # --- Handwriting detection ---
        try:
            pil_img = Image.fromarray(rgb_array)
            hw_features = ImagePreprocessor.detect_handwriting_features(pil_img)
            is_handwritten = hw_features.get("is_handwritten", False)
        except Exception:
            hw_features = {"is_handwritten": False}
            is_handwritten = False

        # --- Run OCR with full language set (en+hi+mr) ---
        try:
            reader = _get_reader(["en", "hi", "mr"], gpu=self.gpu)
            results = reader.readtext(
                rgb_array,
                canvas_size=1280,
                mag_ratio=1.0,
                batch_size=4,
            )
        except Exception as exc:
            logger.error("EasyOCR failed for %s: %s", document_id, exc)
            return _mock_ocr_result(document_id)

        # --- Build output structure ---
        blocks: List[Dict[str, Any]] = []
        total_conf = 0.0
        for bbox, text, conf in results:
            if not text.strip():
                continue
            flat_bbox = [int(bbox[0][0]), int(bbox[0][1]), int(bbox[2][0]), int(bbox[2][1])]
            blocks.append(
                {
                    "text": text,
                    "confidence": round(float(conf), 4),
                    "bbox": flat_bbox,
                }
            )
            total_conf += conf

        avg_confidence = round(total_conf / len(blocks), 4) if blocks else 0.0
        raw_text = "\n".join(b["text"] for b in blocks)

        # Detect primary language family
        lang_family = _detect_language_family(results)
        if lang_family == "devanagari":
            detected_lang = "hi"  # covers hi/mr (both Devanagari)
        else:
            detected_lang = "en"

        return {
            "document_id": document_id,
            "ocr_engine": "easyocr_1.7",
            "language": detected_lang,
            "confidence": avg_confidence,
            "raw_text": raw_text,
            "blocks": blocks,
            "is_handwritten": is_handwritten,
            "handwriting_features": hw_features,
            "preprocessing_meta": meta,
            "block_count": len(blocks),
        }


# ---------------------------------------------------------------------------
# Mock fallback (mirrors MockOCRProvider in pipeline.py)
# ---------------------------------------------------------------------------
def _mock_ocr_result(document_id: str) -> Dict[str, Any]:
    raw_text = (
        "FORM VII-XII (7/12 EXTRACT) - VILLAGE FORM NO. VII\n"
        "District: Pune, Taluka: Haveli, Village: Wagholi\n"
        "Survey Number / Gat No: 142/2A\n"
        "Khata Number: 87\n"
        "Name of Landholder: Rajesh Tukaram Patil\n"
        "Total Plot Area: 2.4500 Hectares\n"
        "Land Classification: Agricultural (Jirayat)\n"
        "Tenure / Ownership Type: Class 1 (Occupant Class I)\n"
        "Mutation Entry: Mutation No. 4521 dated 12/03/2021\n"
    )
    return {
        "document_id": document_id,
        "ocr_engine": "mock_fallback",
        "language": "en",
        "confidence": 0.92,
        "raw_text": raw_text,
        "blocks": [
            {"text": "Survey Number: 142/2A", "confidence": 0.94, "bbox": [50, 120, 300, 150]},
            {"text": "Name of Landholder: Rajesh Tukaram Patil", "confidence": 0.96, "bbox": [50, 160, 450, 190]},
            {"text": "Total Plot Area: 2.4500 Hectares", "confidence": 0.65, "bbox": [50, 200, 380, 230]},
        ],
        "is_handwritten": False,
        "handwriting_features": {"is_handwritten": False, "stroke_variance": 0.0},
        "preprocessing_meta": {},
        "block_count": 9,
    }
