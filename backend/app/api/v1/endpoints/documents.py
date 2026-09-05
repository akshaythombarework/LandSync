import logging
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from app.audit.service import AuditService
from app.auth.deps import get_current_user, require_role
from app.auth.models import CurrentUser, RoleCode
from app.core.errors import NotFoundException, ValidationException
from app.core.supabase import get_supabase_client
from app.documents.storage import StorageService

logger = logging.getLogger("novaax.documents")
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    language: str = Form("en"),
    document_category: str = Form("LAND_RECORD"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Ingests a document: validates file type/size, stores in private bucket 'land-records',
    records metadata in public.documents, and creates an audit event.
    """
    content = await file.read()
    storage_path, unique_id = await StorageService.upload_document(file, content, user_id=current_user.id)

    doc_id = str(uuid.uuid4())
    client = get_supabase_client()
    display_id = f"DOC-{doc_id[:6].upper()}"

    doc_record = {
        "id": doc_id,
        "file_name": file.filename or "uploaded_document",
        "file_type": file.content_type,
        "file_size": len(content),
        "storage_path": storage_path,
        "uploaded_by": current_user.id if (not current_user.id.startswith("test-") and not current_user.id.startswith("00000000")) else None,
        "language": language,
        "document_category": document_category,
        "page_count": 1,
        "status": "UPLOADED",
    }

    if client:
        try:
            insert_payload = dict(doc_record)
            if not insert_payload.get("uploaded_by"):
                insert_payload.pop("uploaded_by", None)
            res = client.table("documents").insert(insert_payload).execute()
            if res.data and len(res.data) > 0:
                doc_record = res.data[0]
                display_id = doc_record.get("display_id", display_id)
        except Exception as e:
            logger.error(f"Failed to persist document to Supabase: {e}")

    await AuditService.log_event(
        action="DOCUMENT_UPLOADED",
        entity_type="document",
        entity_id=doc_id,
        user_id=current_user.id,
        description=f"Document '{file.filename}' uploaded by {current_user.name}",
        metadata={"file_name": file.filename, "file_size": len(content), "storage_path": storage_path},
    )

    return {
        "id": doc_id,
        "display_id": display_id,
        "status": "UPLOADED",
        "file_name": file.filename,
        "file_size": len(content),
        "data": doc_record,
    }


@router.get("")
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns a paginated list of uploaded documents with optional filtering.
    """
    client = get_supabase_client()
    if client:
        try:
            query = client.table("documents").select("*", count="exact")
            if status:
                query = query.eq("status", status.upper())
            if language:
                query = query.eq("language", language)
            if search:
                query = query.ilike("file_name", f"%{search}%")

            # Scope restriction: Citizen only sees their own documents
            if current_user.role == RoleCode.CITIZEN.value:
                query = query.eq("uploaded_by", current_user.id)

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
            logger.error(f"Failed to query documents from Supabase: {e}")

    return {
        "items": [],
        "page": page,
        "page_size": page_size,
        "total": 0,
    }


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Retrieves document metadata along with an authorized signed URL for viewing the file.
    """
    client = get_supabase_client()
    doc = None
    if client:
        try:
            res = client.table("documents").select("*").eq("id", document_id).execute()
            if res.data and len(res.data) > 0:
                doc = res.data[0]
        except Exception as e:
            logger.error(f"Failed to fetch document: {e}")

    if not doc:
        raise NotFoundException(f"Document with ID '{document_id}' not found.")

    # Citizen ownership check
    if current_user.role == RoleCode.CITIZEN.value and doc.get("uploaded_by") != current_user.id:
        raise NotFoundException(f"Document with ID '{document_id}' not found.")

    # Generate temporary signed URL for authorized viewing
    signed_url = await StorageService.get_signed_url(doc.get("storage_path", ""))

    response_data = {
        **doc,
        "signed_url": signed_url,
    }

    return {
        "data": response_data,
        **response_data,
    }
