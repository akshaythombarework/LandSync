"""Document image preprocessing with Pillow and OpenCV."""

from __future__ import annotations

import io
import logging
from typing import Optional, Tuple, Union

import numpy as np
from PIL import Image, ImageOps

logger = logging.getLogger("novaax.extraction.preprocess")

# Cap long edge so EasyOCR stays within reasonable memory/time on scans.
_MAX_LONG_EDGE = 2400


def load_pil_image(source: Union[str, bytes]) -> Image.Image:
    """Load an image from a filesystem path or raw bytes."""
    if isinstance(source, bytes):
        image = Image.open(io.BytesIO(source))
    else:
        image = Image.open(source)
    image = ImageOps.exif_transpose(image) or image
    if image.mode == "RGBA":
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    elif image.mode == "L":
        image = image.convert("RGB")
    return image


def _resize_if_needed(image: Image.Image) -> Image.Image:
    width, height = image.size
    long_edge = max(width, height)
    if long_edge <= _MAX_LONG_EDGE:
        return image
    scale = _MAX_LONG_EDGE / float(long_edge)
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def _deskew_bgr(bgr: np.ndarray) -> np.ndarray:
    """Deskew using the min-area rectangle of foreground ink, if the tilt is clear."""
    try:
        import cv2
    except ImportError:
        return bgr

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(thresh > 0))
    if coords.size == 0 or len(coords) < 50:
        return bgr
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    if abs(angle) < 0.4 or abs(angle) > 15:
        return bgr
    height, width = bgr.shape[:2]
    matrix = cv2.getRotationMatrix2D((width / 2.0, height / 2.0), angle, 1.0)
    return cv2.warpAffine(
        bgr,
        matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )


def preprocess_image_bytes(source: Union[str, bytes]) -> Tuple[np.ndarray, dict]:
    """
    Return an RGB uint8 array suitable for EasyOCR plus light metadata.

    Steps: load → EXIF-correct → downscale large scans → bilateral denoise → CLAHE → deskew.
    Binarization is intentionally avoided so stamps and Devanagari conjuncts survive.
    """
    pil = load_pil_image(source)
    original_size = pil.size
    pil = _resize_if_needed(pil)

    rgb = np.array(pil)
    meta = {
        "original_size": {"width": original_size[0], "height": original_size[1]},
        "processed_size": {"width": pil.size[0], "height": pil.size[1]},
        "backend": "pillow",
    }

    try:
        import cv2

        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        bgr = cv2.bilateralFilter(bgr, d=5, sigmaColor=35, sigmaSpace=35)
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
        l_ch, a_ch, b_ch = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_ch = clahe.apply(l_ch)
        bgr = cv2.cvtColor(cv2.merge((l_ch, a_ch, b_ch)), cv2.COLOR_LAB2BGR)
        bgr = _deskew_bgr(bgr)
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        meta["backend"] = "pillow+opencv"
    except Exception as exc:
        logger.warning("OpenCV preprocessing skipped: %s", exc)

    if rgb.dtype != np.uint8:
        rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    return rgb, meta


def preprocess_to_rgb_array(source: Union[str, bytes]) -> np.ndarray:
    array, _meta = preprocess_image_bytes(source)
    return array
