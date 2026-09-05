from enum import Enum
from typing import Dict, List
from app.auth.models import RoleCode


class Permission(str, Enum):
    DASHBOARD_VIEW = "dashboard:view"
    DOCUMENT_UPLOAD = "document:upload"
    DOCUMENT_VIEW = "document:view"
    DOCUMENT_PROCESS = "document:process"
    RECORD_VIEW = "record:view"
    RECORD_EDIT = "record:edit"
    RECORD_APPROVE = "record:approve"
    RECORD_REJECT = "record:reject"
    VERIFICATION_ACCESS = "verification:access"
    GIS_VIEW = "gis:view"
    ANALYTICS_VIEW = "analytics:view"
    AUDIT_VIEW = "audit:view"
    USER_MANAGE = "user:manage"


# Role-permission mapping conforming to Section 9 of security_validation_testing.md
ROLE_PERMISSIONS: Dict[RoleCode, List[Permission]] = {
    RoleCode.ADMIN: [p for p in Permission],
    RoleCode.STATE_OFFICER: [
        Permission.DASHBOARD_VIEW,
        Permission.DOCUMENT_UPLOAD,
        Permission.DOCUMENT_VIEW,
        Permission.DOCUMENT_PROCESS,
        Permission.RECORD_VIEW,
        Permission.RECORD_EDIT,
        Permission.RECORD_APPROVE,
        Permission.RECORD_REJECT,
        Permission.VERIFICATION_ACCESS,
        Permission.GIS_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.AUDIT_VIEW,
    ],
    RoleCode.DISTRICT_OFFICER: [
        Permission.DASHBOARD_VIEW,
        Permission.DOCUMENT_UPLOAD,
        Permission.DOCUMENT_VIEW,
        Permission.DOCUMENT_PROCESS,
        Permission.RECORD_VIEW,
        Permission.RECORD_EDIT,
        Permission.RECORD_APPROVE,
        Permission.RECORD_REJECT,
        Permission.VERIFICATION_ACCESS,
        Permission.GIS_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.AUDIT_VIEW,
    ],
    RoleCode.TEHSIL_OFFICER: [
        Permission.DASHBOARD_VIEW,
        Permission.DOCUMENT_UPLOAD,
        Permission.DOCUMENT_VIEW,
        Permission.DOCUMENT_PROCESS,
        Permission.RECORD_VIEW,
        Permission.RECORD_EDIT,
        Permission.RECORD_APPROVE,
        Permission.RECORD_REJECT,
        Permission.VERIFICATION_ACCESS,
        Permission.GIS_VIEW,
        Permission.ANALYTICS_VIEW,
    ],
    RoleCode.VERIFICATION_OFFICER: [
        Permission.DASHBOARD_VIEW,
        Permission.DOCUMENT_UPLOAD,
        Permission.DOCUMENT_VIEW,
        Permission.DOCUMENT_PROCESS,
        Permission.RECORD_VIEW,
        Permission.RECORD_EDIT,
        Permission.RECORD_APPROVE,
        Permission.RECORD_REJECT,
        Permission.VERIFICATION_ACCESS,
        Permission.GIS_VIEW,
        Permission.ANALYTICS_VIEW,
    ],
    RoleCode.SURVEY_OFFICER: [
        Permission.DASHBOARD_VIEW,
        Permission.DOCUMENT_UPLOAD,
        Permission.DOCUMENT_VIEW,
        Permission.RECORD_VIEW,
        Permission.GIS_VIEW,
        Permission.ANALYTICS_VIEW,
    ],
    RoleCode.CITIZEN: [
        Permission.DASHBOARD_VIEW,
        Permission.DOCUMENT_UPLOAD,
        Permission.DOCUMENT_VIEW,
        Permission.RECORD_VIEW,
        Permission.GIS_VIEW,
    ],
}
