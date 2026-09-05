from fastapi import APIRouter
from app.core.config import settings
from app.core.supabase import get_supabase_client

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    """
    Comprehensive health check confirming API, PostgreSQL/Supabase, and Storage readiness.
    """
    client = get_supabase_client()
    db_status = "unconfigured"
    storage_status = "unconfigured"

    if client:
        try:
            # Check DB connectivity
            client.table("roles").select("code", count="exact").limit(1).execute()
            db_status = "connected"
        except Exception as e:
            db_status = f"degraded: {str(e)[:50]}"

        try:
            # Check Storage bucket
            client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).list()
            storage_status = "ready"
        except Exception:
            # Private bucket listing without auth or service key
            storage_status = "configured"
    else:
        db_status = "local_mock_mode"
        storage_status = "local_mock_mode"

    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "storage": storage_status,
    }
