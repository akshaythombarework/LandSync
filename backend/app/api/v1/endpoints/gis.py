import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.auth.deps import get_current_user
from app.auth.models import CurrentUser
from app.core.supabase import get_supabase_client

logger = logging.getLogger("novaax.gis_api")
router = APIRouter(prefix="/gis", tags=["GIS"])


@router.get("/records")
async def get_gis_records(
    district: Optional[str] = Query(None),
    tehsil: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns mapped GIS point locations associated with land records for Leaflet visualization.
    """
    client = get_supabase_client()
    items = []

    if client:
        try:
            # Query gis_locations joined with land_records
            query = client.table("gis_locations").select("*, land_records!inner(*)")
            if status:
                query = query.eq("land_records.status", status.upper())
            if district:
                query = query.ilike("land_records.district", district)
            if tehsil:
                query = query.ilike("land_records.tehsil", tehsil)
            if village:
                query = query.ilike("land_records.village", village)

            res = query.execute()
            for row in res.data or []:
                rec = row.get("land_records") or {}
                items.append({
                    "gis_id": row.get("id"),
                    "record_id": row.get("record_id"),
                    "display_id": rec.get("display_id"),
                    "latitude": float(row.get("latitude")),
                    "longitude": float(row.get("longitude")),
                    "owner_name": rec.get("landowner_name"),
                    "survey_number": rec.get("survey_number"),
                    "plot_area": rec.get("plot_area"),
                    "plot_area_unit": rec.get("plot_area_unit", "hectares"),
                    "village": rec.get("village"),
                    "tehsil": rec.get("tehsil"),
                    "district": rec.get("district"),
                    "status": rec.get("status"),
                })
        except Exception as e:
            logger.error(f"Failed to query GIS locations: {e}")

    return {
        "items": items,
        "total": len(items),
    }
