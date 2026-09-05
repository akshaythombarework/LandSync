from fastapi import APIRouter
from app.api.v1.endpoints import (
    analytics,
    audit,
    documents,
    gis,
    health,
    processing,
    records,
    users,
    validation,
    verification,
)

api_router = APIRouter()

# Register core v1 modular endpoints
api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(documents.router)
api_router.include_router(processing.router)
api_router.include_router(records.router)
api_router.include_router(verification.router)
api_router.include_router(validation.router)
api_router.include_router(gis.router)
api_router.include_router(analytics.router)
api_router.include_router(audit.router)
