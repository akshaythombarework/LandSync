import logging
from typing import Optional
from supabase import Client, create_client
from app.core.config import settings

logger = logging.getLogger("novaax.supabase")

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns the Supabase service client instance.
    Uses SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY if service key not set).
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not settings.SUPABASE_URL or not key:
        logger.warning(
            "SUPABASE_URL or API key is not configured. Falling back to local mode."
        )
        return None

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, key)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def is_supabase_configured() -> bool:
    client = get_supabase_client()
    return client is not None
