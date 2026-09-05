"""Runtime verification of EasyOCR language support (en, hi, mr)."""

from __future__ import annotations

import logging
from typing import Dict, Iterable, List, Sequence, Set

logger = logging.getLogger("novaax.extraction.language")

REQUESTED_DEFAULT = ("en", "hi", "mr")
# Devanagari-script fallback if a requested Indic code is missing at runtime.
DEVANAGARI_FALLBACK = "hi"


def _load_easyocr_language_sets() -> Dict[str, Set[str]]:
    """Inspect EasyOCR config without constructing a Reader (avoids model download)."""
    from easyocr.config import all_lang_list, devanagari_lang_list

    return {
        "all": set(all_lang_list),
        "devanagari": set(devanagari_lang_list),
    }


def verify_easyocr_languages(requested: Sequence[str] | None = None) -> Dict[str, object]:
    """
    Return which requested languages EasyOCR actually supports in this install.

    EasyOCR only allows one script family plus English in a single Reader.
    English + Hindi + Marathi is valid because hi/mr share Devanagari.
    """
    wanted = [lang.strip().lower() for lang in (requested or REQUESTED_DEFAULT) if lang.strip()]
    supported: Set[str] = set()
    missing: List[str] = []
    limitations: List[str] = []
    error: str | None = None

    try:
        sets = _load_easyocr_language_sets()
        catalog = sets["all"]
        for lang in wanted:
            if lang in catalog:
                supported.add(lang)
            else:
                missing.append(lang)
        if "mr" in missing and DEVANAGARI_FALLBACK in catalog:
            supported.add(DEVANAGARI_FALLBACK)
            limitations.append(
                "Marathi (mr) is not in this EasyOCR language catalog; "
                "Hindi (hi) Devanagari recognition will be used as a script fallback."
            )
        elif "mr" in supported:
            limitations.append(
                "Marathi uses EasyOCR's shared Devanagari generation-1 model "
                "(not a Marathi-specific recognizer); handwriting accuracy is limited."
            )
    except Exception as exc:
        error = str(exc)
        logger.warning("Could not inspect EasyOCR language catalog: %s", exc)
        limitations.append(f"EasyOCR language catalog could not be read: {exc}")

    usable = [lang for lang in wanted if lang in supported]
    if "en" in supported and "en" not in usable:
        usable.insert(0, "en")
    if not usable and "en" in supported:
        usable = ["en"]

    return {
        "requested": wanted,
        "supported": sorted(supported),
        "missing": missing,
        "usable": usable,
        "limitations": limitations,
        "error": error,
    }


def usable_reader_langs(requested: Iterable[str] | None = None) -> List[str]:
    report = verify_easyocr_languages(list(requested) if requested else None)
    usable = list(report["usable"])
    return usable or ["en"]
