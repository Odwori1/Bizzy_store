from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# CORRECTED IMPORT
from app.database import get_db

from app.core.auth import get_current_user
from app.core.permissions import requires_permission

from app.schemas.role_schema import Role
from app.crud.role import get_roles

router = APIRouter(prefix="/api/roles", tags=["roles"])

# USE DEPENDENCIES PARAMETER INSTEAD OF DECORATOR
@router.get("/", response_model=List[Role], dependencies=[Depends(requires_permission("role:manage"))])
def read_roles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a list of all available roles and their permissions.
    Requires the 'role:manage' permission.
    """
    try:
        db_roles = get_roles(db)
        # Convert SQLAlchemy models to the schema response model
        role_response = []
        for db_role in db_roles:
            # Extract just the permission names for the response
            permission_names = [perm.name for perm in db_role.permissions]
            role_data = {
                "id": db_role.id,
                "name": db_role.name,
                "description": db_role.description,
                "is_default": db_role.is_default,
                "permissions": permission_names
            }
            role_response.append(role_data)
        return role_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch roles: {str(e)}")
