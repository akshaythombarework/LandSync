import abc
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.audit.service import AuditService
from app.core.supabase import get_supabase_client
from app.validation.service import ValidationService

logger = logging.getLogger("novaax.processing")


class OCRProvider(abc.ABC):
    @abc.abstractmethod
    async def extract_text(
        self,
        document_id: str,
        storage_path: str,
        mime_type: str,
        image_source: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Extracts text and layout blocks from a document."""
        pass


class ExtractionProvider(abc.ABC):
    @abc.abstractmethod
    async def extract_fields(self, ocr_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts structured land record fields from OCR results."""
        pass


class MockOCRProvider(OCRProvider):
    async def extract_text(
        self,
        document_id: str,
        storage_path: str,
        mime_type: str,
        image_source: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Mock OCR engine that produces simulated multilingual OCR text and bounding blocks.
        """
        raw_text = (
            "FORM VII-XII (7/12 EXTRACT) - VILLAGE FORM NO. VII\n"
            "District: Pune, Taluka: Haveli, Village: Wagholi\n"
            "Survey Number / Gat No: 142/2A\n"
            "Khata Number: 87, Khasra Number: 312\n"
            "Name of Landholder: Rajesh Tukaram Patil\n"
            "Total Plot Area: 2.4500 Hectares (Pot Kharaba: 0.1500 Ha)\n"
            "Assessment: Rs. 14.50\n"
            "Land Classification: Agricultural (Jirayat)\n"
            "Tenure / Ownership Type: Class 1 (Occupant Class I)\n"
            "Mutation Entry: Mutation No. 4521 dated 12/03/2021 verified.\n"
        )

        blocks = [
            {"text": "FORM VII-XII (7/12 EXTRACT)", "confidence": 0.98, "bbox": [50, 40, 400, 70]},
            {"text": "District: Pune, Taluka: Haveli, Village: Wagholi", "confidence": 0.95, "bbox": [50, 80, 500, 110]},
            {"text": "Survey Number: 142/2A", "confidence": 0.94, "bbox": [50, 120, 300, 150]},
            {"text": "Name of Landholder: Rajesh Tukaram Patil", "confidence": 0.96, "bbox": [50, 160, 450, 190]},
            {"text": "Total Plot Area: 2.4500 Hectares", "confidence": 0.65, "bbox": [50, 200, 380, 230]},
            {"text": "Land Classification: Agricultural (Jirayat)", "confidence": 0.91, "bbox": [50, 240, 420, 270]},
        ]

        return {
            "document_id": document_id,
            "ocr_engine": "mock_tesseract_v5",
            "language": "en",
            "confidence": 0.92,
            "raw_text": raw_text,
            "blocks": blocks,
        }


class MockExtractionProvider(ExtractionProvider):
    async def extract_fields(self, ocr_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mock LLM extractor returning standardized schema fields with individual confidence.
        """
        return {
            "landowner_name": "Rajesh Tukaram Patil",
            "survey_number": "142/2A",
            "khasra_number": "312",
            "khata_number": "87",
            "plot_area": 2.45,
            "plot_area_unit": "hectares",
            "village": "Wagholi",
            "tehsil": "Haveli",
            "district": "Pune",
            "land_classification": "Agricultural (Jirayat)",
            "ownership_type": "Class 1 (Occupant Class I)",
            "ownership_details": "Sole Proprietor - 100% Share",
            "mutation_information": "Mutation No. 4521 dated 12/03/2021",
            "registration_information": "Reg. Deed 2021/7890 Haveli Sub-Registrar",
            "latitude": 18.5793,
            "longitude": 73.9822,
            "field_confidences": {
                "landowner_name": 0.96,
                "survey_number": 0.94,
                "khasra_number": 0.92,
                "khata_number": 0.91,
                "plot_area": 0.65,  # Intentional low confidence to demonstrate review trigger
                "plot_area_unit": 0.98,
                "village": 0.95,
                "tehsil": 0.95,
                "district": 0.97,
                "land_classification": 0.91,
                "ownership_type": 0.93,
            },
        }


class ProcessingPipelineService:
    def __init__(
        self,
        ocr_provider: Optional[OCRProvider] = None,
        extraction_provider: Optional[ExtractionProvider] = None,
    ):
        self.ocr_provider = ocr_provider or MockOCRProvider()
        self.extraction_provider = extraction_provider or MockExtractionProvider()

    async def run_pipeline(
        self,
        document_id: str,
        job_id: str,
        storage_path: str,
        mime_type: str,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrates the asynchronous mock document digitization pipeline:
        Job Queued -> OCR -> Extraction -> Record Creation -> Validation -> Completed
        """
        client = get_supabase_client()
        logger.info(f"Starting processing pipeline for Document {document_id}, Job {job_id}")

        await AuditService.log_event(
            action="PROCESSING_STARTED",
            entity_type="document",
            entity_id=document_id,
            user_id=user_id,
            description=f"Processing pipeline initiated for job {job_id}",
        )

        try:
            # 1. Update job to OCR stage
            now_iso = datetime.now(timezone.utc).isoformat()
            if client:
                try:
                    client.table("processing_jobs").update({
                        "status": "OCR_PROCESSING",
                        "current_stage": "OCR",
                        "started_at": now_iso,
                    }).eq("id", job_id).execute()
                    client.table("documents").update({"status": "PROCESSING"}).eq("id", document_id).execute()
                except Exception as e:
                    logger.error(f"Failed to update job stage to OCR: {e}")

            # 2. Execute OCR
            ocr_output = await self.ocr_provider.extract_text(document_id, storage_path, mime_type)

            # Persist OCR results
            ocr_id = str(uuid.uuid4())
            if client:
                try:
                    client.table("ocr_results").insert({
                        "id": ocr_id,
                        "document_id": document_id,
                        "raw_text": ocr_output["raw_text"],
                        "ocr_engine": ocr_output["ocr_engine"],
                        "language": ocr_output["language"],
                        "confidence": ocr_output["confidence"],
                        "blocks": ocr_output.get("blocks", []),
                    }).execute()
                except Exception as e:
                    logger.error(f"Failed to persist OCR results: {e}")

            # 3. Update job to Extraction stage
            if client:
                try:
                    client.table("processing_jobs").update({
                        "status": "EXTRACTION_PROCESSING",
                        "current_stage": "EXTRACTION",
                    }).eq("id", job_id).execute()
                except Exception as e:
                    logger.error(f"Failed to update job stage to EXTRACTION: {e}")

            # 4. Execute Structured Extraction
            extracted = await self.extraction_provider.extract_fields(ocr_output)

            # 5. Persist Land Record
            record_id = str(uuid.uuid4())
            record_data = {
                "id": record_id,
                "document_id": document_id,
                "landowner_name": extracted.get("landowner_name"),
                "survey_number": extracted.get("survey_number"),
                "khasra_number": extracted.get("khasra_number"),
                "khata_number": extracted.get("khata_number"),
                "plot_area": extracted.get("plot_area"),
                "plot_area_unit": extracted.get("plot_area_unit", "hectares"),
                "village": extracted.get("village"),
                "tehsil": extracted.get("tehsil"),
                "district": extracted.get("district"),
                "land_classification": extracted.get("land_classification"),
                "ownership_type": extracted.get("ownership_type"),
                "ownership_details": extracted.get("ownership_details"),
                "mutation_information": extracted.get("mutation_information"),
                "registration_information": extracted.get("registration_information"),
                "status": "VALIDATION_PENDING",
            }

            if client:
                try:
                    client.table("land_records").insert(record_data).execute()
                except Exception as e:
                    logger.error(f"Failed to persist land_record: {e}")

            # 6. Persist Record Fields with confidence
            confidences = extracted.get("field_confidences", {})
            field_list = []
            for fname, conf in confidences.items():
                fval = str(extracted.get(fname, ""))
                field_entry = {
                    "id": str(uuid.uuid4()),
                    "record_id": record_id,
                    "field_name": fname,
                    "field_value": fval,
                    "original_value": fval,
                    "confidence": conf,
                    "source_type": "AI_EXTRACTION",
                }
                field_list.append(field_entry)
                if client:
                    try:
                        client.table("record_fields").insert(field_entry).execute()
                    except Exception as e:
                        logger.error(f"Failed to persist record field {fname}: {e}")

            # 7. Persist GIS Location if available
            lat = extracted.get("latitude")
            lng = extracted.get("longitude")
            if lat and lng and client:
                try:
                    client.table("gis_locations").insert({
                        "id": str(uuid.uuid4()),
                        "record_id": record_id,
                        "latitude": lat,
                        "longitude": lng,
                        "source": "DOCUMENT_METADATA",
                    }).execute()
                except Exception as e:
                    logger.error(f"Failed to persist GIS location: {e}")

            # 8. Run Validation
            if client:
                try:
                    client.table("processing_jobs").update({
                        "status": "VALIDATION_PROCESSING",
                        "current_stage": "VALIDATION",
                    }).eq("id", job_id).execute()
                except Exception as e:
                    logger.error(f"Failed to update job stage to VALIDATION: {e}")

            val_res = await ValidationService.validate_record(record_id, record_data, field_list)
            final_record_status = val_res.get("overall_status", "REVIEW_REQUIRED")

            # 9. Update Record and Document Status
            completed_iso = datetime.now(timezone.utc).isoformat()
            if client:
                try:
                    client.table("land_records").update({"status": final_record_status}).eq("id", record_id).execute()
                    client.table("documents").update({"status": final_record_status}).eq("id", document_id).execute()
                    client.table("processing_jobs").update({
                        "status": "COMPLETED",
                        "current_stage": "COMPLETED",
                        "completed_at": completed_iso,
                    }).eq("id", job_id).execute()
                except Exception as e:
                    logger.error(f"Failed to update final status: {e}")

            await AuditService.log_event(
                action="PROCESSING_COMPLETED",
                entity_type="processing_job",
                entity_id=job_id,
                user_id=user_id,
                description=f"Processing completed for document {document_id}; Status: {final_record_status}",
                metadata={"record_id": record_id, "final_status": final_record_status},
            )

            await AuditService.log_event(
                action="RECORD_CREATED",
                entity_type="land_record",
                entity_id=record_id,
                user_id=user_id,
                description=f"Land record {record_id} extracted and validated",
            )

            return {
                "job_id": job_id,
                "document_id": document_id,
                "record_id": record_id,
                "status": "COMPLETED",
                "record_status": final_record_status,
                "validation": val_res,
            }

        except Exception as err:
            logger.error(f"Processing job {job_id} failed: {err}")
            if client:
                try:
                    client.table("processing_jobs").update({
                        "status": "FAILED",
                        "current_stage": "FAILED",
                        "error_message": str(err),
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", job_id).execute()
                    client.table("documents").update({"status": "FAILED"}).eq("id", document_id).execute()
                except Exception:
                    pass
            raise


# ---------------------------------------------------------------------------
# Global singleton – wire real providers based on config, fallback to mocks
# ---------------------------------------------------------------------------
def _build_processing_service() -> "ProcessingPipelineService":
    from app.core.config import settings

    ocr_prov = None
    ext_prov = None

    if settings.OCR_PROVIDER == "easyocr":
        try:
            from app.extraction.ocr_provider import EasyOCRProvider
            ocr_prov = EasyOCRProvider(languages=list(settings.OCR_LANGUAGES), gpu=False)
            logger.info("Real EasyOCRProvider initialised (langs=%s)", settings.OCR_LANGUAGES)
        except Exception as exc:
            logger.warning("EasyOCR unavailable, falling back to mock OCR: %s", exc)

    if settings.EXTRACTION_PROVIDER == "rule_nlp":
        try:
            from app.extraction.extraction_provider import RuleNLPExtractionProvider
            ext_prov = RuleNLPExtractionProvider()
            logger.info("RuleNLPExtractionProvider initialised")
        except Exception as exc:
            logger.warning("RuleNLP unavailable, falling back to mock extraction: %s", exc)

    return ProcessingPipelineService(
        ocr_provider=ocr_prov,
        extraction_provider=ext_prov,
    )


processing_service = _build_processing_service()
