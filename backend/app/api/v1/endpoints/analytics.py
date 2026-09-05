import logging
from typing import Optional
from fastapi import APIRouter, Depends
from app.auth.deps import get_current_user
from app.auth.models import CurrentUser
from app.core.supabase import get_supabase_client

logger = logging.getLogger("novaax.analytics_api")
router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
async def get_dashboard_summary(
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns aggregated dashboard metrics for overview charts without large data transfers.
    """
    client = get_supabase_client()
    total_docs = 0
    processed = 0
    pending_verification = 0
    approved = 0
    rejected = 0
    validation_issues = 0
    avg_confidence = 0.92

    if client:
        try:
            # Documents count
            doc_res = client.table("documents").select("status", count="exact").execute()
            total_docs = doc_res.count or len(doc_res.data or [])

            # Records status counts
            rec_res = client.table("land_records").select("status").execute()
            for r in rec_res.data or []:
                st = r.get("status")
                if st == "APPROVED":
                    approved += 1
                    processed += 1
                elif st in ["REVIEW_REQUIRED", "VALIDATION_PENDING"]:
                    pending_verification += 1
                elif st == "REJECTED":
                    rejected += 1
                    processed += 1

            # Validation issues count
            val_res = client.table("validation_results").select("id", count="exact").in_("status", ["FAILED", "WARNING"]).execute()
            validation_issues = val_res.count or len(val_res.data or [])

            # Average confidence from ocr_results
            ocr_res = client.table("ocr_results").select("confidence").execute()
            confs = [float(o["confidence"]) for o in (ocr_res.data or []) if o.get("confidence") is not None]
            if confs:
                avg_confidence = round(sum(confs) / len(confs), 3)

        except Exception as e:
            logger.error(f"Failed to calculate analytics: {e}")

    summary_data = {
        "total_documents": total_docs,
        "processed": processed,
        "pending_verification": pending_verification,
        "approved": approved,
        "rejected": rejected,
        "validation_issues": validation_issues,
        "average_confidence": avg_confidence,
    }

    return {
        "data": summary_data,
        **summary_data,
    }
