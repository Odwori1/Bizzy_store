from fastapi import Depends, HTTPException, status
from app.core.auth import get_current_user

def requires_permission(required_permission: str):
    """
    Dependency to require specific permissions.
    Usage: dependencies=[Depends(requires_permission("user:read"))]
    """
    async def _permission_checker(current_user: dict = Depends(get_current_user)):
        print(f"DEBUG: Checking permission '{required_permission}' for user {current_user['email']}. User has: {current_user.get('permissions', [])}")
        if required_permission not in current_user.get("permissions", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{required_permission}' required to access this resource"
            )
        return current_user
    
    return _permission_checker
