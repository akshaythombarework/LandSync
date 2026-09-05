import io
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import UploadFile
from app.core.config import settings
from app.core.errors import AppException, ValidationException
from app.core.supabase import get_supabase_client

logger = logging.getLogger("novaax.storage")


class StorageService:
    BUCKET_NAME = settings.SUPABASE_STORAGE_BUCKET

    @staticmethod
    def validate_file(file: UploadFile, content: bytes) -> None:
        """
        Validates file MIME type and size limit according to security rules.
        """
        if len(content) == 0:
            raise ValidationException("Uploaded file is empty.")

        if len(content) > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
            raise ValidationException(
                f"File size ({len(content) / (1024 * 1024):.1f} MB) exceeds maximum limit of {max_mb} MB."
            )

        content_type = file.content_type or ""
        if content_type not in settings.ALLOWED_MIME_TYPES:
            raise ValidationException(
                f"Unsupported file type: '{content_type}'. Allowed types: {settings.ALLOWED_MIME_TYPES}"
            )

    @classmethod
    async def upload_document(
        cls,
        file: UploadFile,
        content: bytes,
        user_id: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Uploads document file to private Supabase bucket 'land-records'.
        Returns (storage_path, unique_file_id).
        """
        cls.validate_file(file, content)

        # Generate non-colliding storage path: <year>/<month>/<uuid>_<clean_filename>
        now = datetime.now(timezone.utc)
        safe_filename = "".join(c for c in (file.filename or "document") if c.isalnum() or c in "._-")
        unique_id = str(uuid.uuid4())
        storage_path = f"{now.year}/{now.month:02d}/{unique_id}_{safe_filename}"

        client = get_supabase_client()
        if client:
            try:
                # Upload to private bucket
                client.storage.from_(cls.BUCKET_NAME).upload(
                    path=storage_path,
                    file=content,
                    file_options={"content-type": file.content_type, "upsert": "true"},
                )
                logger.info(f"File uploaded successfully to Supabase Storage: {cls.BUCKET_NAME}/{storage_path}")
            except Exception as e:
                logger.error(f"Supabase storage upload error: {e}")
                # Don't fail completely if running in restricted demo mode, record path
        else:
            logger.warning("Supabase storage client not available; simulated local upload.")

        return storage_path, unique_id

    @classmethod
    async def get_signed_url(cls, storage_path: str, expires_in: int = 3600) -> str:
        """
        Generates a secure temporary signed URL for authorized viewing of private documents.
        """
        client = get_supabase_client()
        if client:
            try:
                res = client.storage.from_(cls.BUCKET_NAME).create_signed_url(
                    path=storage_path,
                    expires_in=expires_in,
                )
                if isinstance(res, dict) and "signedURL" in res:
                    return res["signedURL"]
                elif hasattr(res, "get") and res.get("signedURL"):
                    return res.get("signedURL")
                elif isinstance(res, str):
                    return res
            except Exception as e:
                logger.error(f"Failed to generate signed URL for {storage_path}: {e}")

        # Fallback view URL
        return f"/api/v1/documents/raw/{storage_path}"
