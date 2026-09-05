import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.supabase import get_supabase_client

logger = logging.getLogger("novaax.audit")

# Local in-memory audit log buffer for fast queries & testing fallback
_LOCAL_AUDIT_LOGS: List[Dict[str, Any]] = []


class AuditService:
    @staticmethod
    async def log_event(
        action: str,
        entity_type: str,
        entity_id: str,
        user_id: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Creates an audit event entry in public.audit_logs.
        """
        event = {
            "id": str(uuid.uuid4()),
            "user_id": user_id if (user_id and not user_id.startswith("test-") and not user_id.startswith("00000000")) else None,
            "action": action.upper(),
            "entity_type": entity_type.lower(),
            "entity_id": str(entity_id),
            "description": description or f"{action} on {entity_type} {entity_id}",
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Keep in local in-memory audit log for reliable API inspection
        _LOCAL_AUDIT_LOGS.insert(0, event)

        client = get_supabase_client()
        if client:
            try:
                # If user_id is null or non-UUID, insert without user_id
                insert_payload = dict(event)
                if not insert_payload.get("user_id"):
                    insert_payload.pop("user_id", None)
                client.table("audit_logs").insert(insert_payload).execute()
            except Exception as e:
                logger.error(f"Failed to persist audit log to Supabase: {e}")

        logger.info(f"AUDIT: [{event['action']}] {event['entity_type']} {event['entity_id']} - {event['description']}")
        return event

    @staticmethod
    async def get_logs(
        page: int = 1,
        page_size: int = 20,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retrieves paginated audit events.
        """
        client = get_supabase_client()
        if client:
            try:
                query = client.table("audit_logs").select("*", count="exact")
                if action:
                    query = query.eq("action", action.upper())
                if entity_type:
                    query = query.eq("entity_type", entity_type.lower())
                if user_id:
                    query = query.eq("user_id", user_id)

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
                logger.error(f"Failed to query audit_logs from Supabase: {e}")

        # Fallback to in-memory buffer
        filtered = _LOCAL_AUDIT_LOGS
        if action:
            filtered = [e for e in filtered if e["action"] == action.upper()]
        if entity_type:
            filtered = [e for e in filtered if e["entity_type"] == entity_type.lower()]

        start = (page - 1) * page_size
        end = start + page_size
        return {
            "items": filtered[start:end],
            "page": page,
            "page_size": page_size,
            "total": len(filtered),
        }
