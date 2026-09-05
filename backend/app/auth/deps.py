import logging
from typing import Optional
from fastapi import Depends, Header, Request, status
from app.core.config import settings
from app.core.errors import ForbiddenException, UnauthorizedException
from app.core.supabase import get_supabase_client
from app.auth.models import CurrentUser, RoleCode, UserStatus

logger = logging.getLogger("novaax.auth")

# Default in-memory demo users for tests / local development without live auth session
DEMO_USERS = {
    "admin": CurrentUser(
        id="00000000-0000-0000-0000-000000000001",
        auth_user_id="auth-admin-001",
        display_id="USR-000001",
        email="admin@novaax.gov.in",
        name="System Administrator",
        role=RoleCode.ADMIN.value,
        permissions=["*"],
        administrative_scope={"state": "Maharashtra"},
        status=UserStatus.ACTIVE.value,
    ),
    "verification_officer": CurrentUser(
        id="00000000-0000-0000-0000-000000000002",
        auth_user_id="auth-vo-002",
        display_id="USR-000002",
        email="verification.officer@novaax.gov.in",
        name="Priya Sharma (Verification Officer)",
        role=RoleCode.VERIFICATION_OFFICER.value,
        permissions=["verify", "edit_fields", "view_documents"],
        administrative_scope={"state": "Maharashtra", "district": "Pune", "tehsil": "Haveli"},
        status=UserStatus.ACTIVE.value,
    ),
    "district_officer": CurrentUser(
        id="00000000-0000-0000-0000-000000000003",
        auth_user_id="auth-do-003",
        display_id="USR-000003",
        email="district.officer@novaax.gov.in",
        name="Rajesh Deshmukh (District Officer)",
        role=RoleCode.DISTRICT_OFFICER.value,
        permissions=["view_district", "approve", "reject", "analytics"],
        administrative_scope={"state": "Maharashtra", "district": "Pune"},
        status=UserStatus.ACTIVE.value,
    ),
    "citizen": CurrentUser(
        id="00000000-0000-0000-0000-000000000004",
        auth_user_id="auth-cit-004",
        display_id="USR-000004",
        email="citizen@example.com",
        name="Anand Kulkarni",
        role=RoleCode.CITIZEN.value,
        permissions=["upload", "view_own"],
        administrative_scope={},
        status=UserStatus.ACTIVE.value,
    ),
}


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_test_role: Optional[str] = Header(None),
) -> CurrentUser:
    """
    Extracts, verifies, and resolves the current user context.
    1. Checks for Authorization: Bearer <supabase_jwt>
    2. Validates against Supabase Auth
    3. Fetches user record from public.users with role and administrative scope
    4. Supports test/dev role header for automated tests and local dev
    """
    # 1. Check for test role header (for testing and local dev)
    if x_test_role:
        normalized_role = x_test_role.lower()
        if normalized_role in DEMO_USERS:
            return DEMO_USERS[normalized_role]
        # Allow passing arbitrary role code
        role_upper = x_test_role.upper()
        return CurrentUser(
            id=f"test-{normalized_role}-id",
            auth_user_id=f"auth-{normalized_role}",
            display_id="USR-TEST",
            email=f"{normalized_role}@test.local",
            name=f"Test {x_test_role}",
            role=role_upper,
            permissions=[],
            administrative_scope={"district": "Pune", "tehsil": "Haveli"},
            status=UserStatus.ACTIVE.value,
        )

    # 2. Check for Authorization Bearer token
    if not authorization or not authorization.startswith("Bearer "):
        # Check if query parameter has demo user for testing
        demo_param = request.query_params.get("demo_role")
        if demo_param and demo_param.lower() in DEMO_USERS:
            return DEMO_USERS[demo_param.lower()]
        
        raise UnauthorizedException("Authorization header with Bearer token is required")

    token = authorization.replace("Bearer ", "").strip()

    # Support testing tokens like 'Bearer test-token-admin'
    if token.startswith("test-token-"):
        role_key = token.replace("test-token-", "").lower()
        if role_key in DEMO_USERS:
            return DEMO_USERS[role_key]

    client = get_supabase_client()
    if not client:
        # Fallback to default demo user in local development without active Supabase credentials
        logger.warning("Supabase client unavailable; using demo verification officer")
        return DEMO_USERS["verification_officer"]

    try:
        # Verify token with Supabase Auth
        auth_response = client.auth.get_user(token)
        if not auth_response or not auth_response.user:
            raise UnauthorizedException("Invalid or expired authentication token")

        auth_user = auth_response.user
        auth_user_id = str(auth_user.id)
        email = auth_user.email or ""

        # Fetch profile from public.users
        user_res = (
            client.table("users")
            .select("id, display_id, email, name, role_id, administrative_scope, status, roles(code, permissions)")
            .or_(f"auth_user_id.eq.{auth_user_id},email.eq.{email}")
            .execute()
        )

        if not user_res.data or len(user_res.data) == 0:
            logger.info(f"Supabase auth user {auth_user_id} not yet in public.users; creating profile")
            # Lookup default CITIZEN or VERIFICATION_OFFICER role
            role_res = client.table("roles").select("id, code, permissions").eq("code", RoleCode.CITIZEN.value).execute()
            role_id = role_res.data[0]["id"] if role_res.data else None
            role_code = RoleCode.CITIZEN.value
            permissions = role_res.data[0].get("permissions", []) if role_res.data else []

            # Create entry in public.users
            insert_data = {
                "auth_user_id": auth_user_id,
                "email": email,
                "name": email.split("@")[0].capitalize(),
                "role_id": role_id,
                "administrative_scope": {},
                "status": UserStatus.ACTIVE.value,
            }
            create_res = client.table("users").insert(insert_data).execute()
            db_user = create_res.data[0]
            
            return CurrentUser(
                id=db_user["id"],
                auth_user_id=auth_user_id,
                display_id=db_user.get("display_id", "USR-000000"),
                email=email,
                name=db_user["name"],
                role=role_code,
                role_id=role_id,
                permissions=permissions,
                administrative_scope={},
                status=UserStatus.ACTIVE.value,
            )

        db_user = user_res.data[0]
        status_val = db_user.get("status", UserStatus.ACTIVE.value)
        if status_val != UserStatus.ACTIVE.value:
            raise ForbiddenException(f"Account is {status_val.lower()}")

        role_info = db_user.get("roles") or {}
        role_code = role_info.get("code", RoleCode.CITIZEN.value)
        permissions = role_info.get("permissions", [])

        return CurrentUser(
            id=db_user["id"],
            auth_user_id=auth_user_id,
            display_id=db_user.get("display_id", "USR-000000"),
            email=db_user["email"],
            name=db_user["name"],
            role=role_code,
            role_id=db_user.get("role_id"),
            permissions=permissions if isinstance(permissions, list) else [],
            administrative_scope=db_user.get("administrative_scope") or {},
            status=status_val,
        )

    except (UnauthorizedException, ForbiddenException):
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise UnauthorizedException(f"Authentication failed: {str(e)}")


def require_role(*allowed_roles: str):
    """
    Dependency factory that checks if current user has one of the allowed roles.
    """
    async def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role.upper() == RoleCode.ADMIN.value:
            return user  # Admin has universal access
        
        if not user.has_role(*allowed_roles):
            raise ForbiddenException(
                f"Role '{user.role}' is not authorized to perform this operation. Required: {list(allowed_roles)}"
            )
        return user

    return role_checker
