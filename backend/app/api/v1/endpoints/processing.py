import asyncio
import logging
import uuid
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, status
from app.auth.deps import get_current_user
from app.auth.models import CurrentUser
from app.core.errors import NotFoundException
from app.core.supabase import get_supabase_client
from app.processing.pipeline import processing_service

logger = logging.getLogger("novaax.processing_api")
router = APIRouter(prefix="/documents", tags=["Processing"])


@router.post("/{document_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def start_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Initiates asynchronous document digitization pipeline.
    Returns immediately with 202 Accepted and job ID.
    """
    client = get_supabase_client()
    doc = None
    if client:
        try:
            res = client.table("documents").select("*").eq("id", document_id).execute()
            if res.data and len(res.data) > 0:
                doc = res.data[0]
        except Exception as e:
            logger.error(f"Failed to lookup document: {e}")

    if not doc:
        # Fallback simulation document for testing
        doc = {
            "id": document_id,
            "storage_path": f"demo/{document_id}.pdf",
            "file_type": "application/pdf",
        }

    job_id = str(uuid.uuid4())
    if client:
        try:
            client.table("processing_jobs").insert({
                "id": job_id,
                "document_id": document_id,
                "status": "QUEUED",
                "current_stage": "PREPROCESSING",
                "attempt_number": 1,
            }).execute()
            client.table("documents").update({"status": "PROCESSING"}).eq("id", document_id).execute()
        except Exception as e:
            logger.error(f"Failed to create processing job: {e}")

    # Launch background task
    background_tasks.add_task(
        processing_service.run_pipeline,
        document_id=document_id,
        job_id=job_id,
        storage_path=doc.get("storage_path", ""),
        mime_type=doc.get("file_type", "application/pdf"),
        user_id=current_user.id,
    )

    return {
        "job_id": job_id,
        "document_id": document_id,
        "status": "QUEUED",
        "stage": "PREPROCESSING",
    }


@router.get("/{document_id}/processing")
async def get_processing_status(
    document_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns the real-time processing status and stage for a document.
    """
    client = get_supabase_client()
    job = None
    if client:
        try:
            res = (
                client.table("processing_jobs")
                .select("*")
                .eq("document_id", document_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if res.data and len(res.data) > 0:
                job = res.data[0]
        except Exception as e:
            logger.error(f"Failed to query job status: {e}")

    if not job:
        return {
            "document_id": document_id,
            "status": "QUEUED",
            "stage": "PREPROCESSING",
            "progress": 10,
        }

    stage_progress = {
        "PREPROCESSING": 15,
        "CLASSIFICATION": 30,
        "LAYOUT": 45,
        "OCR": 60,
        "EXTRACTION": 75,
        "CONFIDENCE": 85,
        "VALIDATION": 95,
        "COMPLETED": 100,
        "FAILED": 100,
    }

    current_stage = job.get("current_stage", "PREPROCESSING")
    progress = stage_progress.get(current_stage, 50)

    return {
        "job_id": job.get("id"),
        "document_id": document_id,
        "status": job.get("status"),
        "stage": current_stage,
        "progress": progress,
        "error_code": job.get("error_code"),
        "error_message": job.get("error_message"),
    }


@router.get("/{document_id}/extraction")
async def get_extraction_result(
    document_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns the extracted structured fields and confidence scores for a document.
    """
    client = get_supabase_client()
    record = None
    fields = []
    if client:
        try:
            rec_res = client.table("land_records").select("*").eq("document_id", document_id).execute()
            if rec_res.data and len(rec_res.data) > 0:
                record = rec_res.data[0]
                field_res = client.table("record_fields").select("*").eq("record_id", record["id"]).execute()
                fields = field_res.data or []
        except Exception as e:
            logger.error(f"Failed to fetch extraction: {e}")

    if not record:
        raise NotFoundException(f"Extraction result not found for document '{document_id}'.")

    return {
        "record_id": record["id"],
        "display_id": record.get("display_id"),
        "status": record.get("status"),
        "fields": fields,
        "data": record,
    }
