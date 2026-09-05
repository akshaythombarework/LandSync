import logging
from typing import Optional
from fastapi import APIRouter, Depends
from app.auth.deps import get_current_user
from app.auth.models import CurrentUser
from app.core.supabase import get_supabase_client

logger = logging.getLogger("novaax.validation_api")
router = APIRouter(prefix="/validation", tags=["Validation"])


@router.get("")
@router.get("/rules")
async def list_validation_rules(
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns active validation rules configured in the system.
    """
    client = get_supabase_client()
    rules = []
    if client:
        try:
            res = client.table("validation_rules").select("*").eq("active", True).order("created_at").execute()
            rules = res.data or []
        except Exception as e:
            logger.error(f"Failed to fetch validation rules: {e}")

    return {
        "items": rules,
        "total": len(rules),
    }
