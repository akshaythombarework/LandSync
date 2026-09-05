import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.audit.service import AuditService
from app.auth.deps import require_role
from app.auth.models import CurrentUser, RoleCode

logger = logging.getLogger("novaax.audit_api")
router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
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
    Returns immutable audit log entries for administrative tracking.
    """
    return await AuditService.get_logs(
        page=page,
        page_size=page_size,
        action=action,
        entity_type=entity_type,
        user_id=user_id,
    )
