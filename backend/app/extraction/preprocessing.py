"""Document image preprocessing with Pillow and OpenCV for OCR."""

from __future__ import annotations

import io
import logging
from typing import Optional, Tuple, Union

import numpy as np
from PIL import Image, ImageOps

logger = logging.getLogger("novaax.extraction.preprocess")

# OCR optimal long edge range in pixels
_OCR_LONG_EDGE_MIN = 1500
_OCR_LONG_EDGE_MAX = 2500


class ImagePreprocessor:
    """Preprocess document images to optimize for EasyOCR extraction."""

    @staticmethod
    def resize_image(
        image: Image.Image,
        min_long_edge: int = _OCR_LONG_EDGE_MIN,
        max_long_edge: int = _OCR_LONG_EDGE_MAX,
    ) -> Image.Image:
        """Scale image to optimal OCR resolution while preserving aspect ratio."""
        width, height = image.size
        long_edge = max(width, height)

        if long_edge < min_long_edge:
            scale = min_long_edge / float(long_edge)
            new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
            logger.info(
                "Rescaling image from %dx%d to %dx%d (below OCR minimum)",
                width, height, new_size[0], new_size[1],
            )
            return image.resize(new_size, Image.Resampling.LANCZOS)

        if long_edge > max_long_edge:
            scale = max_long_edge / float(long_edge)
            new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
            logger.info(
                "Rescaling image from %dx%d to %dx%d (above OCR maximum)",
                width, height, new_size[0], new_size[1],
            )
            return image.resize(new_size, Image.Resampling.LANCZOS)

        logger.info("Image size %dx%d is within OCR optimal range", width, height)
        return image

    @staticmethod
    def to_grayscale(image: Image.Image) -> Image.Image:
        """Convert image to single-channel grayscale with EXIF correction."""
        image = ImageOps.exif_transpose(image) or image
        if image.mode != "L":
            image = image.convert("L")
        return image

    @staticmethod
    def enhance_contrast(
        image: Image.Image,
        clip_limit: float = 2.0,
        tile_grid_size: Tuple[int, int] = (8, 8),
    ) -> Image.Image:
        """Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to boost faint text."""
        try:
            import cv2

            bgr = np.array(image.convert("RGB"))
            lab = cv2.cvtColor(bgr, cv2.COLOR_RGB2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
            l_channel = clahe.apply(l_channel)
            enhanced_bgr = cv2.cvtColor(cv2.merge((l_channel, a_channel, b_channel)), cv2.COLOR_LAB2RGB)
            return Image.fromarray(enhanced_bgr)
        except ImportError:
            logger.warning("OpenCV not available for CLAHE; returning original image")
            return image

    @staticmethod
    def denoise(
        image: Image.Image,
        strength: float = 5.0,
    ) -> Image.Image:
        """Apply bilateral filtering to eliminate paper grain/speckles without eroding strokes."""
        try:
            import cv2

            bgr = np.array(image.convert("RGB"))
            denoised_bgr = cv2.bilateralFilter(bgr, d=5, sigmaColor=35, sigmaSpace=35)
            return Image.fromarray(denoised_bgr)
        except ImportError:
            logger.warning("OpenCV not available for denoising; returning original image")
            return image

    @staticmethod
    def detect_handwriting_features(
        image: Image.Image,
    ) -> dict:
        """
        Heuristic detection to determine if a document page is predominantly handwritten.
        Returns a dict with analysis results.
        """
        try:
            import cv2

            gray = np.array(image.convert("L"))
            # Threshold to binary
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            # Compute stroke variance: handwritten text has higher variance in stroke width
            kernel = np.ones((3, 3), np.uint8)
            dilated = cv2.dilate(binary, kernel, iterations=1)
            eroded = cv2.erode(binary, kernel, iterations=1)
            stroke_variance = np.mean((dilated.astype(float) - eroded.astype(float)) ** 2)

            # Simple heuristic: if variance is high, likely handwritten
            is_handwritten = bool(stroke_variance > 1500)

            return {
                "is_handwritten": is_handwritten,
                "stroke_variance": float(stroke_variance),
                "description": "Handwritten detected" if is_handwritten else "Printed/typed detected",
            }
        except Exception as exc:
            logger.warning("Handwriting detection failed: %s", exc)
            return {
                "is_handwritten": False,
                "stroke_variance": 0.0,
                "description": "Unknown",
            }