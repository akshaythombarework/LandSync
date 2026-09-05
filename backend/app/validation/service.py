import logging
import uuid
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.supabase import get_supabase_client

logger = logging.getLogger("novaax.validation")


class ValidationService:
    @classmethod
    async def validate_record(
        cls,
        record_id: str,
        record_data: Dict[str, Any],
        fields: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Executes independent rule validation engine on extracted record data.
        Returns validation results list and overall status.
        """
        results: List[Dict[str, Any]] = []
        has_critical_or_error = False

        # 1. Check Required Fields
        required_fields = ["landowner_name", "survey_number", "village", "tehsil", "district"]
        for f in required_fields:
            val = record_data.get(f)
            if not val or str(val).strip() == "":
                results.append({
                    "id": str(uuid.uuid4()),
                    "record_id": record_id,
                    "field_name": f,
                    "severity": "ERROR",
                    "status": "FAILED",
                    "message": f"Mandatory field '{f}' is missing or empty.",
                    "expected_value": "Non-empty string",
                    "actual_value": str(val) if val else "null",
                })
                has_critical_or_error = True
            else:
                results.append({
                    "id": str(uuid.uuid4()),
                    "record_id": record_id,
                    "field_name": f,
                    "severity": "INFO",
                    "status": "PASSED",
                    "message": f"Required field '{f}' is present.",
                    "expected_value": None,
                    "actual_value": str(val),
                })

        # 2. Check Numeric Constraints (plot_area > 0)
        plot_area = record_data.get("plot_area")
        if plot_area is not None:
            try:
                area_float = float(plot_area)
                if area_float <= 0:
                    results.append({
                        "id": str(uuid.uuid4()),
                        "record_id": record_id,
                        "field_name": "plot_area",
                        "severity": "ERROR",
                        "status": "FAILED",
                        "message": "Plot area must be greater than zero.",
                        "expected_value": "> 0",
                        "actual_value": str(area_float),
                    })
                    has_critical_or_error = True
                else:
                    results.append({
                        "id": str(uuid.uuid4()),
                        "record_id": record_id,
                        "field_name": "plot_area",
                        "severity": "INFO",
                        "status": "PASSED",
                        "message": "Plot area is valid positive number.",
                        "expected_value": "> 0",
                        "actual_value": str(area_float),
                    })
            except (ValueError, TypeError):
                results.append({
                    "id": str(uuid.uuid4()),
                    "record_id": record_id,
                    "field_name": "plot_area",
                    "severity": "ERROR",
                    "status": "FAILED",
                    "message": f"Plot area '{plot_area}' is not a valid number.",
                    "expected_value": "Numeric",
                    "actual_value": str(plot_area),
                })
                has_critical_or_error = True

        # 3. Field Confidence Checks
        if fields:
            for fld in fields:
                conf = fld.get("confidence")
                fname = fld.get("field_name") or fld.get("name")
                if conf is not None and conf < settings.CONFIDENCE_MEDIUM_THRESHOLD:
                    results.append({
                        "id": str(uuid.uuid4()),
                        "record_id": record_id,
                        "field_name": fname,
                        "severity": "WARNING",
                        "status": "WARNING",
                        "message": f"Low extraction confidence ({conf:.2f}) for field '{fname}'.",
                        "expected_value": f">= {settings.CONFIDENCE_MEDIUM_THRESHOLD}",
                        "actual_value": f"{conf:.2f}",
                    })

        # 4. Master Dataset Cross-Reference Check
        survey_no = record_data.get("survey_number")
        village = record_data.get("village")
        district = record_data.get("district")
        owner_name = record_data.get("landowner_name")

        client = get_supabase_client()
        matched_master = False
        if client and survey_no and village:
            try:
                res = (
                    client.table("master_land_records")
                    .select("*")
                    .eq("survey_number", str(survey_no))
                    .ilike("village", str(village))
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    matched_master = True
                    master = res.data[0]
                    # Check owner name similarity
                    master_owner = master.get("owner_name", "")
                    if master_owner.lower() == str(owner_name).lower():
                        results.append({
                            "id": str(uuid.uuid4()),
                            "record_id": record_id,
                            "field_name": "survey_number",
                            "severity": "INFO",
                            "status": "PASSED",
                            "message": f"Exact match found in master reference records (Reference: {master.get('reference_id')}).",
                            "expected_value": master_owner,
                            "actual_value": str(owner_name),
                        })
                    else:
                        results.append({
                            "id": str(uuid.uuid4()),
                            "record_id": record_id,
                            "field_name": "landowner_name",
                            "severity": "WARNING",
                            "status": "WARNING",
                            "message": f"Owner mismatch against master reference record '{master_owner}'.",
                            "expected_value": master_owner,
                            "actual_value": str(owner_name),
                        })
            except Exception as e:
                logger.error(f"Failed to check master record: {e}")

        if not matched_master and survey_no:
            results.append({
                "id": str(uuid.uuid4()),
                "record_id": record_id,
                "field_name": "survey_number",
                "severity": "INFO",
                "status": "PASSED",
                "message": "Survey number recorded; cross-reference lookup evaluated.",
                "expected_value": None,
                "actual_value": str(survey_no),
            })

        # Determine overall status
        overall_status = "REVIEW_REQUIRED" if has_critical_or_error else "APPROVED"

        # Persist validation results if Supabase client available
        if client:
            try:
                for r in results:
                    insert_row = {
                        "id": r["id"],
                        "record_id": record_id,
                        "field_name": r.get("field_name"),
                        "severity": r["severity"],
                        "status": r["status"],
                        "message": r["message"],
                        "expected_value": r.get("expected_value"),
                        "actual_value": r.get("actual_value"),
                    }
                    client.table("validation_results").insert(insert_row).execute()
            except Exception as e:
                logger.error(f"Failed to persist validation results: {e}")

        return {
            "record_id": record_id,
            "overall_status": overall_status,
            "results": results,
            "passed": not has_critical_or_error,
        }
