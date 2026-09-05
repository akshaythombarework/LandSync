from fastapi import APIRouter, Depends
from app.auth.deps import get_current_user
from app.auth.models import CurrentUser

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_my_profile(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns authenticated user's profile, application role, and administrative scope.
    """
    user_data = {
        "id": current_user.id,
        "auth_user_id": current_user.auth_user_id,
        "display_id": current_user.display_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "scope": current_user.administrative_scope,
        "permissions": current_user.permissions,
        "status": current_user.status,
    }
    return {
        "data": user_data,
        # Flattened fields for convenient frontend consumption
        **user_data,
    }
