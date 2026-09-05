"""
Unit and integration tests for OCR and Structured Extraction modules.
"""

import pytest
from app.extraction.ocr_provider import EasyOCRProvider, _mock_ocr_result
from app.extraction.extraction_provider import (
    RuleNLPExtractionProvider,
    _extract_en,
    _extract_devanagari,
    _compute_confidence,
)
from app.extraction.preprocess import preprocess_image_bytes
from app.extraction.preprocessing import ImagePreprocessor
from PIL import Image
import numpy as np


def test_mock_ocr_fallback():
    res = _mock_ocr_result("test-doc-123")
    assert res["document_id"] == "test-doc-123"
    assert res["ocr_engine"] == "mock_fallback"
    assert res["confidence"] > 0.8
    assert "FORM VII-XII" in res["raw_text"]
    assert len(res["blocks"]) > 0


def test_extract_en():
    text = (
        "FORM VII-XII (7/12 EXTRACT)\n"
        "District: Pune, Taluka: Haveli, Village: Wagholi, State: Maharashtra\n"
        "Survey Number: 142/2A\n"
        "Khata Number: 87\n"
        "Name of Landholder: Rajesh Tukaram Patil\n"
        "Total Plot Area: 2.4500 Hectares\n"
        "Land Classification: Agricultural (Jirayat)\n"
        "Tenure / Ownership Type: Class 1 (Occupant Class I)\n"
        "Mutation Entry: Mutation No. 4521\n"
        "Registration Deed: REG-98765-PUNE\n"
    )
    res = _extract_en(text)
    assert res.get("district") == "Pune"
    assert res.get("tehsil") == "Haveli"
    assert res.get("village") == "Wagholi"
    assert res.get("state") == "Maharashtra"
    assert res.get("survey_number") == "142/2A"
    assert res.get("khata_number") == "87"
    assert "Rajesh Tukaram Patil" in res.get("landowner_name", "")
    assert res.get("plot_area") == "2.45"
    assert "Agricultural" in res.get("land_classification", "")
    assert "Class 1" in res.get("ownership_type", "")
    assert res.get("mutation_number") == "4521"
    assert res.get("registration_number") == "REG-98765-PUNE"


def test_extract_devanagari_hindi():
    text = (
        "उद्धरण खतौनी\n"
        "जनपदः अयोध्या\n"
        "तहसीलः मिल्कीपुर\n"
        "ग्राम का नाम : सूफी\n"
        "खातेदार का नाम : हरिशंकर शुक्ल\n"
        "खसरा क्रमांक : 2861\n"
        "खाता संख्या : 1265\n"
        "क्षेत्रफल : 0.3670\n"
    )
    res = _extract_devanagari(text)
    assert "अयोध्या" in res.get("district", "")
    assert "मिल्कीपुर" in res.get("tehsil", "")
    assert "सूफी" in res.get("village", "")
    assert "हरिशंकर" in res.get("landowner_name", "")
    assert "2861" in res.get("survey_number", "")
    assert "1265" in res.get("khata_number", "")
    assert res.get("plot_area") == "0.367" or "0.3670" in str(res.get("plot_area"))


def test_rule_nlp_extraction_provider_pipeline():
    import asyncio
    extractor = RuleNLPExtractionProvider()
    ocr_result = _mock_ocr_result("test-123")
    fields = asyncio.run(extractor.extract_fields(ocr_result))

    assert fields["survey_number"] == "142/2A"
    assert fields["landowner_name"] == "Rajesh Tukaram Patil"
    assert fields["plot_area"] == 2.45
    assert fields["plot_area_unit"] == "hectares"
    assert "field_confidences" in fields
    assert fields["field_confidences"]["landowner_name"] > 0.5
    assert "is_handwritten" in fields


def test_handwriting_features_detection():
    # Synthetic flat image vs synthetic noisy stroke image
    flat_img = Image.fromarray(np.ones((200, 200, 3), dtype=np.uint8) * 255)
    features = ImagePreprocessor.detect_handwriting_features(flat_img)
    assert not features["is_handwritten"]


def test_confidence_computation():
    blocks = [{"text": "Survey Number: 142/2A", "confidence": 0.95}]
    conf = _compute_confidence(
        field="survey_number",
        value="142/2A",
        ocr_confidence=0.90,
        is_handwritten=False,
        blocks=blocks,
    )
    assert conf >= 0.85

    # Handwritten penalty check
    conf_hw = _compute_confidence(
        field="survey_number",
        value="142/2A",
        ocr_confidence=0.90,
        is_handwritten=True,
        blocks=blocks,
    )
    assert conf_hw < conf
