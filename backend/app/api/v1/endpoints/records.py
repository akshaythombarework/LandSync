import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from app.audit.service import AuditService
from app.auth.deps import get_current_user, require_role
from app.auth.models import CurrentUser, RoleCode
from app.core.errors import ForbiddenException, NotFoundException, ValidationException
from app.core.supabase import get_supabase_client
from app.validation.service import ValidationService

logger = logging.getLogger("novaax.records")
router = APIRouter(prefix="/records", tags=["Records"])


class RecordUpdatePayload(BaseModel):
    landowner_name: Optional[str] = None
    survey_number: Optional[str] = None
    khasra_number: Optional[str] = None
    khata_number: Optional[str] = None
    plot_area: Optional[float] = None
    plot_area_unit: Optional[str] = None
    village: Optional[str] = None
    tehsil: Optional[str] = None
    district: Optional[str] = None
    land_classification: Optional[str] = None
    ownership_type: Optional[str] = None
    ownership_details: Optional[str] = None
    reason: Optional[str] = "Field updated by officer"


class RejectPayload(BaseModel):
    reason: str


class ApprovePayload(BaseModel):
    approval_notes: Optional[str] = "Approved following automated and human validation review."


@router.get("")
async def list_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    tehsil: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    List land records with filtering, searching, administrative scope enforcement, and pagination.
    """
    client = get_supabase_client()
    if client:
        try:
            query = client.table("land_records").select("*, gis_locations(*)", count="exact")
            if status:
                query = query.eq("status", status.upper())
            if district:
                query = query.ilike("district", district)
            if tehsil:
                query = query.ilike("tehsil", tehsil)
            if village:
                query = query.ilike("village", village)
            if search:
                query = query.or_(f"landowner_name.ilike.%{search}%,survey_number.ilike.%{search}%,village.ilike.%{search}%")

            # Apply user's administrative scope if constrained
            scope_dist = current_user.administrative_scope.get("district")
            if scope_dist and current_user.role not in [RoleCode.ADMIN.value, RoleCode.STATE_OFFICER.value]:
                query = query.ilike("district", scope_dist)

            start = (page - 1) * page_size
            end = start + page_size - 1
            res = query.order("created_at", desc=True).range(start, end).execute()

            return {
                "items": res.data or [],
                "page": page,
                "page_size": page_size,
                "total": res.count or len(res.data or []),
            }
        except Exception as e:
            logger.error(f"Failed to fetch records: {e}")

    return {
        "items": [],
        "page": page,
        "page_size": page_size,
        "total": 0,
    }


@router.get("/{record_id}")
async def get_record(
    record_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Retrieves complete digital land record with field lineage, document link, and GIS data.
    """
    client = get_supabase_client()
    record = None
    fields = []
    gis = None
    validation = []

    if client:
        try:
            rec_res = client.table("land_records").select("*, documents(*)").eq("id", record_id).execute()
            if rec_res.data and len(rec_res.data) > 0:
                record = rec_res.data[0]
                # Fields
                f_res = client.table("record_fields").select("*").eq("record_id", record_id).execute()
                fields = f_res.data or []
                # GIS
                g_res = client.table("gis_locations").select("*").eq("record_id", record_id).execute()
                gis = g_res.data[0] if g_res.data else None
                # Validation
                v_res = client.table("validation_results").select("*").eq("record_id", record_id).execute()
                validation = v_res.data or []
        except Exception as e:
            logger.error(f"Failed to query record: {e}")

    if not record:
        raise NotFoundException(f"Land record '{record_id}' not found.")

    # Scope check
    if not current_user.can_access_scope(district=record.get("district"), tehsil=record.get("tehsil")):
        raise ForbiddenException("Access denied: record is outside your administrative jurisdiction.")

    response_data = {
        **record,
        "fields": fields,
        "gis": gis,
        "validation_results": validation,
    }
    return {
        "data": response_data,
        **response_data,
    }


@router.patch("/{record_id}")
async def update_record(
    record_id: str,
    payload: RecordUpdatePayload,
    current_user: CurrentUser = Depends(
        require_role(
            RoleCode.ADMIN.value,
            RoleCode.STATE_OFFICER.value,
            RoleCode.DISTRICT_OFFICER.value,
            RoleCode.TEHSIL_OFFICER.value,
            RoleCode.VERIFICATION_OFFICER.value,
        )
    ),
):
    """
    Allows authorized officers to modify record fields, tracking corrections with audit logging.
    """
    client = get_supabase_client()
    update_dict = payload.model_dump(exclude_unset=True, exclude={"reason"})
    if not update_dict:
        raise ValidationException("No fields provided for update.")

    # Mark status as CORRECTED
    update_dict["status"] = "CORRECTED"
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    if client:
        try:
            client.table("land_records").update(update_dict).eq("id", record_id).execute()
        except Exception as e:
            logger.error(f"Failed to update land_record: {e}")

    await AuditService.log_event(
        action="RECORD_UPDATED",
        entity_type="land_record",
        entity_id=record_id,
        user_id=current_user.id,
        description=f"Record updated by {current_user.name}: {payload.reason}",
        metadata={"changes": update_dict, "reason": payload.reason},
    )

    return {
        "record_id": record_id,
        "status": "CORRECTED",
        "updated_fields": list(update_dict.keys()),
    }


@router.post("/{record_id}/approve")
async def approve_record(
    record_id: str,
    payload: ApprovePayload = ApprovePayload(),
    current_user: CurrentUser = Depends(
        require_role(
            RoleCode.ADMIN.value,
            RoleCode.STATE_OFFICER.value,
            RoleCode.DISTRICT_OFFICER.value,
            RoleCode.TEHSIL_OFFICER.value,
            RoleCode.VERIFICATION_OFFICER.value,
        )
    ),
):
    """
    Approves a digital land record following validation and human verification.
    """
    client = get_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()
    approval_id = str(uuid.uuid4())

    approver_id = current_user.id if (not current_user.id.startswith("test-") and not current_user.id.startswith("00000000")) else None

    if client:
        try:
            client.table("land_records").update({
                "status": "APPROVED",
                "approved_by": approver_id,
                "approved_at": now_iso,
            }).eq("id", record_id).execute()

            # Record in approvals table
            client.table("approvals").insert({
                "id": approval_id,
                "record_id": record_id,
                "approved_by": approver_id,
                "status": "APPROVED",
                "approval_notes": payload.approval_notes,
                "approved_at": now_iso,
            }).execute()
        except Exception as e:
            logger.error(f"Failed to record approval: {e}")

    await AuditService.log_event(
        action="RECORD_APPROVED",
        entity_type="land_record",
        entity_id=record_id,
        user_id=current_user.id,
        description=f"Record approved by {current_user.name} ({current_user.role})",
        metadata={"notes": payload.approval_notes},
    )

    return {
        "record_id": record_id,
        "status": "APPROVED",
        "approved_at": now_iso,
        "approved_by": current_user.name,
    }


@router.post("/{record_id}/reject")
async def reject_record(
    record_id: str,
    payload: RejectPayload,
    current_user: CurrentUser = Depends(
        require_role(
            RoleCode.ADMIN.value,
            RoleCode.STATE_OFFICER.value,
            RoleCode.DISTRICT_OFFICER.value,
            RoleCode.TEHSIL_OFFICER.value,
            RoleCode.VERIFICATION_OFFICER.value,
        )
    ),
):
    """
    Rejects a record. Requires an explicit, non-empty rejection reason.
    """
    if not payload.reason or payload.reason.strip() == "":
        raise ValidationException("A clear rejection reason is mandatory.")

    client = get_supabase_client()
    approver_id = current_user.id if (not current_user.id.startswith("test-") and not current_user.id.startswith("00000000")) else None

    if client:
        try:
            client.table("land_records").update({
                "status": "REJECTED",
            }).eq("id", record_id).execute()

            client.table("approvals").insert({
                "id": str(uuid.uuid4()),
                "record_id": record_id,
                "approved_by": approver_id,
                "status": "REJECTED",
                "approval_notes": payload.reason,
            }).execute()
        except Exception as e:
            logger.error(f"Failed to record rejection: {e}")

    await AuditService.log_event(
        action="RECORD_REJECTED",
        entity_type="land_record",
        entity_id=record_id,
        user_id=current_user.id,
        description=f"Record rejected by {current_user.name}: {payload.reason}",
        metadata={"reason": payload.reason},
    )

    return {
        "record_id": record_id,
        "status": "REJECTED",
        "reason": payload.reason,
    }


@router.get("/{record_id}/validation")
async def get_record_validation(
    record_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns automated validation findings, rule outcomes, and severity for a land record.
    """
    client = get_supabase_client()
    results = []
    if client:
        try:
            res = client.table("validation_results").select("*").eq("record_id", record_id).execute()
            results = res.data or []
        except Exception as e:
            logger.error(f"Failed to query validation results: {e}")

    has_errors = any(r.get("severity") in ["ERROR", "CRITICAL"] and r.get("status") == "FAILED" for r in results)
    overall_status = "REVIEW_REQUIRED" if has_errors else "PASSED"

    return {
        "record_id": record_id,
        "overall_status": overall_status,
        "results": results,
    }
