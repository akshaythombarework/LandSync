import os
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NovaaX Land Record Digitization"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Server host & port
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000

    # CORS – accepts JSON list or comma-separated string
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip().startswith("[") and v.strip().endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return []

    # Supabase & Database Configuration (Environment-based)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    DATABASE_URL: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "land-records"

    # Document & Storage Constraints
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ]

    # Confidence Thresholds (0.90-1.00 High, 0.70-0.89 Med, <0.70 Low)
    CONFIDENCE_HIGH_THRESHOLD: float = 0.90
    CONFIDENCE_MEDIUM_THRESHOLD: float = 0.70

    # OCR / AI Provider Configuration
    # Set OCR_PROVIDER="mock" for fast headless testing; "easyocr" for real inference
    OCR_PROVIDER: str = "easyocr"
    EXTRACTION_PROVIDER: str = "rule_nlp"
    # Languages loaded by EasyOCR (must be a valid EasyOCR language code list)
    OCR_LANGUAGES: List[str] = ["en", "hi", "mr"]

    @field_validator("OCR_LANGUAGES", mode="before")
    @classmethod
    def assemble_ocr_languages(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip().startswith("[") and v.strip().endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [lang.strip() for lang in v.split(",") if lang.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return ["en", "hi", "mr"]

    # Pagination Constraints
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
