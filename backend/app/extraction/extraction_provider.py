"""
Rule-based / NLP structured field extractor for NovaaX.

Implements the ExtractionProvider ABC defined in processing/pipeline.py.
Extracts 12 target fields from OCR text using regex + keyword patterns
for English, Hindi, and Marathi land record documents.

Fields extracted:
  landowner_name, survey_number, khata_number, khasra_number,
  plot_area, plot_area_unit, village, tehsil, district, state,
  land_classification, ownership_type, mutation_information, registration_information
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("novaax.extraction.extractor")

# ---------------------------------------------------------------------------
# Field confidence thresholds
# ---------------------------------------------------------------------------
HIGH_CONF = 0.88   # OCR + regex matched clearly
MED_CONF  = 0.70   # OCR matched with lower-quality signal
LOW_CONF  = 0.45   # Guessed from context / weak signal
HANDWRITTEN_PENALTY = 0.20  # Subtract from all confidences for handwritten docs

# ---------------------------------------------------------------------------
# Regex patterns – English
# ---------------------------------------------------------------------------
_EN_PATTERNS: Dict[str, List[str]] = {
    "landowner_name": [
        r"(?:name\s+of\s+(?:land\s*holder|owner|occupant|proprietor)|landholder|khatedar)[:\s]+([A-Z][a-zA-Z .'-]{2,50}?)(?=\s*(?:,|;|\n|total|plot|survey|khata|$))",
        r"(?:owner|holder)\s*[:\-]\s*([A-Z][a-zA-Z .'-]{2,50}?)(?=\s*(?:,|;|\n|total|plot|survey|khata|$))",
    ],
    "survey_number": [
        r"(?:survey\s*(?:no\.?|number)|gat\s*no\.?|s\.?\s*no\.?)[:\s]*([0-9][0-9A-Za-z/\-]*)",
        r"(?:khasra|khata)\s*no\.?[:\s]*([0-9][0-9A-Za-z/\-]*)",
    ],
    "khata_number": [
        r"(?:khata|khat|account)\s*(?:no\.?|number)[:\s]*([0-9][0-9A-Za-z/\-]*)",
        r"khata\s*[:\-]\s*([0-9]+)",
    ],
    "khasra_number": [
        r"(?:khasra|plot\s*no\.?)[:\s]*([0-9][0-9A-Za-z/\-]*)",
    ],
    "plot_area": [
        r"(?:total\s*)?(?:plot\s*area|area|pot\s*kharaba)[:\s]*([0-9]+\.?[0-9]*)\s*(?:hectare|ha|acre|sq)",
        r"([0-9]+\.[0-9]+)\s*(?:hectare|ha|acre)",
    ],
    "village": [
        r"(?:village|gram|graam|mouza)[:\s]+([A-Za-z][a-zA-Z ]{1,35}?)(?=\s*(?:,|;|\n|district|taluka|tehsil|state|survey|$))",
    ],
    "tehsil": [
        r"(?:taluka|tehsil|taluk|tahasil)[:\s]+([A-Za-z][a-zA-Z ]{1,35}?)(?=\s*(?:,|;|\n|district|village|state|survey|$))",
    ],
    "district": [
        r"(?:district|dist\.?|zila)[:\s]+([A-Za-z][a-zA-Z ]{1,35}?)(?=\s*(?:,|;|\n|taluka|tehsil|village|state|survey|$))",
    ],
    "state": [
        r"(?:state|rajya)[:\s]+([A-Za-z][a-zA-Z ]{1,35}?)(?=\s*(?:,|;|\n|district|taluka|tehsil|village|survey|$))",
    ],
    "land_classification": [
        r"(?:land\s*class(?:ification)?|type\s*of\s*land|land\s*use)[:\s]+([A-Za-z][a-zA-Z (),\-]{2,50}?)(?=\s*(?:\n|tenure|ownership|mutation|$))",
        r"(?:jirayat|bagayat|paddy|agricultural|non.agricultural|barren)[a-zA-Z (),\-]{0,40}",
    ],
    "ownership_type": [
        r"(?:tenure|ownership\s*type|class\s*of\s*land)[:\s]+([A-Za-z0-9][a-zA-Z0-9 ()\-,]{2,50}?)(?=\s*(?:\n|mutation|registration|$))",
        r"(?:class\s*[1-3I]+\s*\([^)]+\))",
    ],
    "mutation_number": [
        r"(?:mutation\s*(?:no\.?|number|entry)|mut\.?\s*no\.?)[:\s]*([0-9][0-9A-Za-z/\-]*)",
    ],
    "registration_number": [
        r"(?:registration\s*(?:no\.?|deed|deed\s*no\.?)|reg\.?\s*(?:no\.?|deed))[:\s]*([0-9A-Za-z/\-]+)",
    ],
}


# ---------------------------------------------------------------------------
_HI_KEYWORDS: Dict[str, List[str]] = {
    "village":      ["ग्राम का नाम", "ग्राम क्रमाक", "ग्राम", "गाँव", "गांव"],
    "tehsil":       ["तहसीलः", "तहसील", "तालुका", "तहसीलदार"],
    "district":     ["जनपदः", "जनपद", "जिला", "ज़िला"],
    "state":        ["राज्य"],
    "landowner_name": ["खातेदार का नाम", "खाताधारक", "स्वामी", "भूस्वामी"],
    "survey_number": ["खसरा", "खसरा क्रमांक", "गाट नं", "सर्वे नं", "गाटे का"],
    "khata_number":  ["खाता", "खाता संख्या", "खाता क्रमाक"],
    "plot_area":     ["क्षत्रफल", "रकबा", "क्षेत्रफल", "भूमि क्षेत्र"],
    "mutation_number": ["दाखिल खारिज", "म्युटेशन", "नामांतरण", "परिवर्तन"],
    "registration_number": ["पंजीकरण", "रजिस्ट्री"],
}

# Marathi keyword → field mappings
_MR_KEYWORDS: Dict[str, List[str]] = {
    "village":      ["गाव", "ग्राम", "गावाचे नाव"],
    "tehsil":       ["तालूका", "तालुका", "तहसील"],
    "district":     ["जिल्हा", "जिल्ह्याचे"],
    "state":        ["राज्य"],
    "landowner_name": ["धारकाचे नाव", "खातेदार", "जमीनधारक"],
    "survey_number": ["सर्वे नं", "गट नं", "गट क्रमांक"],
    "khata_number":  ["खाते क्रमांक", "खाता"],
    "plot_area":     ["क्षेत्र", "क्षेत्रफळ", "हेक्टर"],
    "mutation_number": ["फेरफार", "नामांतर"],
    "registration_number": ["नोंदणी"],
}



def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _extract_en(raw_text: str) -> Dict[str, Optional[str]]:
    """Extract fields from English/Latin-script OCR text."""
    extracted: Dict[str, Optional[str]] = {}
    text = _normalize_whitespace(raw_text)
    text_lower = text.lower()

    for field, patterns in _EN_PATTERNS.items():
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = m.group(1).strip() if m.lastindex and m.lastindex >= 1 else m.group(0).strip()
                extracted[field] = val
                break

    # Special: parse plot_area as float
    if "plot_area" in extracted and extracted["plot_area"]:
        try:
            extracted["plot_area"] = str(float(extracted["plot_area"]))
        except ValueError:
            pass

    return extracted


def _extract_devanagari(raw_text: str) -> Dict[str, Optional[str]]:
    """
    Extract fields from Hindi/Marathi Devanagari OCR text using keyword proximity.
    After each keyword, extract the next meaningful token/phrase on that line.
    """
    extracted: Dict[str, Optional[str]] = {}
    lines = [_normalize_whitespace(l) for l in raw_text.split("\n") if l.strip()]
    all_keywords = {}
    all_keywords.update(_HI_KEYWORDS)
    for field, kwds in _MR_KEYWORDS.items():
        all_keywords.setdefault(field, []).extend(kwds)

    for field, keywords in all_keywords.items():
        if field in extracted:
            continue
        for kw in keywords:
            for line in lines:
                if kw in line:
                    # Extract everything after the keyword on that line
                    idx = line.find(kw)
                    after = line[idx + len(kw):].strip()
                    # Remove leading punctuation
                    after = re.sub(r"^[:\-।\s]+", "", after).strip()
                    # Take the first meaningful segment (up to 50 chars)
                    segment = re.split(r"[,।|]", after)[0].strip()[:50]
                    if segment:
                        extracted[field] = segment
                        break
            if field in extracted:
                break

    # Also try English patterns on mixed text (Hindi docs often have English numbers)
    en_extracted = _extract_en(raw_text)
    for field in ["survey_number", "khata_number", "khasra_number", "plot_area", "mutation_number"]:
        if field not in extracted and field in en_extracted and en_extracted[field]:
            extracted[field] = en_extracted[field]

    return extracted


def _compute_confidence(
    field: str,
    value: Optional[str],
    ocr_confidence: float,
    is_handwritten: bool,
    blocks: List[Dict],
) -> float:
    """
    Estimate field-level confidence from:
    - OCR block confidence for the block containing the extracted text
    - Whether the document is handwritten
    - Whether the value looks well-formed
    """
    if value is None:
        return 0.0

    # Find best OCR block confidence for this value
    best_block_conf = 0.0
    for block in blocks:
        if value.lower() in block.get("text", "").lower():
            best_block_conf = max(best_block_conf, block.get("confidence", 0.0))

    if best_block_conf > 0:
        conf = (ocr_confidence * 0.3 + best_block_conf * 0.7)
    else:
        conf = ocr_confidence * 0.6  # lower confidence if no block matched

    # Boost if value matches expected format
    if field == "survey_number" and re.match(r"^[0-9]+[/A-Za-z0-9\-]*$", value):
        conf = min(conf + 0.05, 1.0)
    if field in ("khata_number", "khasra_number") and re.match(r"^[0-9]+$", value):
        conf = min(conf + 0.05, 1.0)
    if field == "plot_area" and re.match(r"^[0-9]+\.?[0-9]*$", value):
        conf = min(conf + 0.05, 1.0)

    if is_handwritten:
        conf = max(0.0, conf - HANDWRITTEN_PENALTY)

    return round(min(conf, 1.0), 4)


# ---------------------------------------------------------------------------
# Public extraction provider class
# ---------------------------------------------------------------------------
class RuleNLPExtractionProvider:
    """
    Regex + keyword NLP extraction provider.

    Implements the ExtractionProvider ABC used by ProcessingPipelineService.
    Works on top of the OCR result dict produced by EasyOCRProvider.

    Low-confidence fields (< CONFIDENCE_MEDIUM_THRESHOLD) are preserved as-is
    so the downstream ValidationService can route them to human review.
    """

    REVIEW_THRESHOLD = 0.70

    async def extract_fields(self, ocr_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract structured land-record fields from OCR result dict.
        Returns a dict matching the ProcessingPipelineService expectations.
        """
        raw_text: str = ocr_result.get("raw_text", "")
        blocks: List[Dict] = ocr_result.get("blocks", [])
        ocr_confidence: float = ocr_result.get("confidence", 0.5)
        is_handwritten: bool = ocr_result.get("is_handwritten", False)
        detected_lang: str = ocr_result.get("language", "en")

        # Choose extraction strategy based on detected language
        if detected_lang in ("hi", "mr") or _has_devanagari(raw_text):
            extracted_raw = _extract_devanagari(raw_text)
            # Also run English patterns for numeric fields
            en_raw = _extract_en(raw_text)
            for f in ["survey_number", "khata_number", "khasra_number", "plot_area",
                      "mutation_number", "registration_number"]:
                if f not in extracted_raw or not extracted_raw[f]:
                    if f in en_raw and en_raw[f]:
                        extracted_raw[f] = en_raw[f]
        else:
            extracted_raw = _extract_en(raw_text)

        # Parse plot_area to float
        plot_area_val = None
        plot_area_unit = "hectares"
        if extracted_raw.get("plot_area"):
            try:
                raw_area = str(extracted_raw["plot_area"])
                nums = re.findall(r"[0-9]+\.?[0-9]*", raw_area)
                if nums:
                    plot_area_val = float(nums[0])
            except Exception:
                pass
            if "acre" in raw_area.lower():
                plot_area_unit = "acres"

        # Build field confidences
        field_confidences: Dict[str, float] = {}
        for field in [
            "landowner_name", "survey_number", "khata_number", "khasra_number",
            "plot_area", "village", "tehsil", "district", "state",
            "land_classification", "ownership_type", "mutation_number", "registration_number"
        ]:
            raw_val = extracted_raw.get(field) if field not in ("plot_area",) else (
                str(plot_area_val) if plot_area_val else None
            )
            field_confidences[field] = _compute_confidence(
                field, raw_val, ocr_confidence, is_handwritten, blocks
            )

        # If handwritten, force overall review flag
        needs_review = is_handwritten or any(
            c < self.REVIEW_THRESHOLD
            for f, c in field_confidences.items()
            if f in ("landowner_name", "survey_number", "village")
        )

        result = {
            "landowner_name": extracted_raw.get("landowner_name"),
            "survey_number": extracted_raw.get("survey_number"),
            "khasra_number": extracted_raw.get("khasra_number"),
            "khata_number": extracted_raw.get("khata_number"),
            "plot_area": plot_area_val,
            "plot_area_unit": plot_area_unit,
            "village": extracted_raw.get("village"),
            "tehsil": extracted_raw.get("tehsil"),
            "district": extracted_raw.get("district"),
            "state": extracted_raw.get("state"),
            "land_classification": extracted_raw.get("land_classification"),
            "ownership_type": extracted_raw.get("ownership_type"),
            "mutation_information": extracted_raw.get("mutation_number"),
            "registration_information": extracted_raw.get("registration_number"),
            "latitude": None,
            "longitude": None,
            "field_confidences": field_confidences,
            "ocr_engine": ocr_result.get("ocr_engine", "easyocr_1.7"),
            "detected_language": detected_lang,
            "is_handwritten": is_handwritten,
            "needs_human_review": needs_review,
            "raw_text_snippet": raw_text[:500] if raw_text else "",
        }

        # Log a quick summary
        filled = sum(1 for k in ["landowner_name", "survey_number", "village", "tehsil", "district"]
                     if result.get(k))
        logger.info(
            "Extracted %d/5 core fields. handwritten=%s needs_review=%s lang=%s",
            filled, is_handwritten, needs_review, detected_lang
        )
        return result


def _has_devanagari(text: str) -> bool:
    """Returns True if text contains Devanagari Unicode characters."""
    return any(0x0900 <= ord(c) <= 0x097F for c in text)
