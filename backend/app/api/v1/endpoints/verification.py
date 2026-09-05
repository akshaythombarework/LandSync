import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from app.audit.service import AuditService
from app.auth.deps import get_current_user, require_role
from app.auth.models import CurrentUser, RoleCode
from app.core.errors import NotFoundException, ValidationException
from app.core.supabase import get_supabase_client
from app.documents.storage import StorageService

logger = logging.getLogger("novaax.verification")
router = APIRouter(prefix="/verification", tags=["Verification"])


class ReviewChangeItem(BaseModel):
    field: str
    value: Any
    reason: str = "Corrected against source document"


class SaveReviewChangesPayload(BaseModel):
    changes: List[ReviewChangeItem]
    review_notes: Optional[str] = None


@router.get("")
async def get_verification_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    district: Optional[str] = Query(None),
    tehsil: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(
        require_role(
            RoleCode.ADMIN.value,
            RoleCode.STATE_OFFICER.value,
            RoleCode.DISTRICT_OFFICER.value,
            RoleCode.TEHSIL_OFFICER.value,
            RoleCode.VERIFICATION_OFFICER.value,
            RoleCode.SURVEY_OFFICER.value,
        )
    ),
):
    """
    Returns prioritized verification queue of land records pending human review.
    """
    client = get_supabase_client()
    if client:
        try:
            query = (
                client.table("land_records")
                .select("*, documents(*)", count="exact")
                .in_("status", ["REVIEW_REQUIRED", "VALIDATION_PENDING", "CORRECTED"])
            )
            if district:
                query = query.ilike("district", district)
            if tehsil:
                query = query.ilike("tehsil", tehsil)

            scope_dist = current_user.administrative_scope.get("district")
            if scope_dist and current_user.role not in [RoleCode.ADMIN.value, RoleCode.STATE_OFFICER.value]:
                query = query.ilike("district", scope_dist)

            start = (page - 1) * page_size
            end = start + page_size - 1
            res = query.order("created_at", desc=False).range(start, end).execute()

            return {
                "items": res.data or [],
                "page": page,
                "page_size": page_size,
                "total": res.count or len(res.data or []),
            }
        except Exception as e:
            logger.error(f"Failed to query verification queue: {e}")

    return {
        "items": [],
        "page": page,
        "page_size": page_size,
        "total": 0,
    }


@router.get("/{record_id}")
async def get_review_detail(
    record_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns full side-by-side context for human reviewer:
    Document view link, OCR blocks, candidate fields, confidence scores, and validation issues.
    """
    client = get_supabase_client()
    record = None
    document = None
    fields = []
    ocr = None
    validation = []

    if client:
        try:
            rec_res = client.table("land_records").select("*, documents(*)").eq("id", record_id).execute()
            if rec_res.data and len(rec_res.data) > 0:
                record = rec_res.data[0]
                document = record.get("documents")
                doc_id = record.get("document_id")

                f_res = client.table("record_fields").select("*").eq("record_id", record_id).execute()
                fields = f_res.data or []

                if doc_id:
                    ocr_res = client.table("ocr_results").select("*").eq("document_id", doc_id).execute()
                    if ocr_res.data and len(ocr_res.data) > 0:
                        ocr = ocr_res.data[0]

                v_res = client.table("validation_results").select("*").eq("record_id", record_id).execute()
                validation = v_res.data or []
        except Exception as e:
            logger.error(f"Failed to fetch review detail: {e}")

    if not record:
        raise NotFoundException(f"Record '{record_id}' not found.")

    signed_url = None
    if document and document.get("storage_path"):
        signed_url = await StorageService.get_signed_url(document["storage_path"])

    return {
        "record": record,
        "document": document,
        "signed_document_url": signed_url,
        "fields": fields,
        "ocr_result": ocr,
        "validation_issues": [v for v in validation if v.get("status") in ["FAILED", "WARNING"]],
        "all_validation": validation,
    }


@router.post("/{record_id}/start")
async def start_review(
    record_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Claims/starts a review session for a record.
    """
    client = get_supabase_client()
    review_id = str(uuid.uuid4())
    reviewer_id = current_user.id if (not current_user.id.startswith("test-") and not current_user.id.startswith("00000000")) else None

    if client:
        try:
            client.table("reviews").insert({
                "id": review_id,
                "record_id": record_id,
                "reviewer_id": reviewer_id,
                "status": "IN_PROGRESS",
                "started_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception as e:
            logger.error(f"Failed to start review: {e}")

    return {
        "review_id": review_id,
        "record_id": record_id,
        "status": "IN_PROGRESS",
        "reviewer": current_user.name,
    }


@router.patch("/{record_id}")
async def save_review_changes(
    record_id: str,
    payload: SaveReviewChangesPayload,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Saves reviewer corrections to public.review_changes, updates record fields,
    and updates land_records status to CORRECTED.
    """
    if not payload.changes:
        raise ValidationException("At least one field correction is required.")

    client = get_supabase_client()
    reviewer_id = current_user.id if (not current_user.id.startswith("test-") and not current_user.id.startswith("00000000")) else None
    now_iso = datetime.now(timezone.utc).isoformat()

    updates = {}
    for ch in payload.changes:
        updates[ch.field] = ch.value
        # Record change audit in review_changes table
        if client:
            try:
                client.table("review_changes").insert({
                    "id": str(uuid.uuid4()),
                    "record_id": record_id,
                    "field_name": ch.field,
                    "new_value": str(ch.value),
                    "reason": ch.reason,
                    "changed_by": reviewer_id,
                }).execute()
            except Exception as e:
                logger.error(f"Failed to insert review change: {e}")

    updates["status"] = "CORRECTED"
    updates["updated_at"] = now_iso

    if client:
        try:
            client.table("land_records").update(updates).eq("id", record_id).execute()
        except Exception as e:
            logger.error(f"Failed to update record with corrections: {e}")

    await AuditService.log_event(
        action="RECORD_EDITED",
        entity_type="land_record",
        entity_id=record_id,
        user_id=current_user.id,
        description=f"Human corrections saved by {current_user.name}",
        metadata={"changes": [c.model_dump() for c in payload.changes], "notes": payload.review_notes},
    )

    return {
        "record_id": record_id,
        "status": "CORRECTED",
        "saved_changes_count": len(payload.changes),
    }
