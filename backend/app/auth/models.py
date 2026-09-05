from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RoleCode(str, Enum):
    ADMIN = "ADMIN"
    STATE_OFFICER = "STATE_OFFICER"
    DISTRICT_OFFICER = "DISTRICT_OFFICER"
    TEHSIL_OFFICER = "TEHSIL_OFFICER"
    VERIFICATION_OFFICER = "VERIFICATION_OFFICER"
    SURVEY_OFFICER = "SURVEY_OFFICER"
    CITIZEN = "CITIZEN"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class AdministrativeScope(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    village: Optional[str] = None


class CurrentUser(BaseModel):
    id: str
    auth_user_id: Optional[str] = None
    display_id: str = "USR-000001"
    email: str
    name: str
    role: str = RoleCode.VERIFICATION_OFFICER.value
    role_id: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    administrative_scope: Dict[str, Any] = Field(default_factory=dict)
    status: str = UserStatus.ACTIVE.value

    def has_role(self, *roles: str) -> bool:
        return self.role.upper() in [r.upper() for r in roles]

    def can_access_scope(self, district: Optional[str] = None, tehsil: Optional[str] = None, village: Optional[str] = None) -> bool:
        """
        Check if user's administrative scope permits accessing the entity.
        Admins and State Officers have broad scope.
        """
        if self.role in [RoleCode.ADMIN.value, RoleCode.STATE_OFFICER.value]:
            return True
        
        user_dist = self.administrative_scope.get("district")
        if user_dist and district and user_dist.lower() != district.lower():
            return False

        user_tehsil = self.administrative_scope.get("tehsil")
        if user_tehsil and tehsil and user_tehsil.lower() != tehsil.lower():
            return False

        user_village = self.administrative_scope.get("village")
        if user_village and village and user_village.lower() != village.lower():
            return False

        return True
