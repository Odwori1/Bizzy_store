from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from fastapi import HTTPException

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/auth_output")
async def test_auth_output(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Temporary endpoint to see what get_current_user returns.
    """
    # This will show us the type and content
    return {
        "message": "Output of get_current_user",
        "type_of_current_user": str(type(current_user)),
        "value_of_current_user": current_user,
        "has_id_attr": hasattr(current_user, 'id'),
        "id_value": current_user.id if hasattr(current_user, 'id') else "NO 'id' ATTRIBUTE",
        "is_dict": isinstance(current_user, dict),
        "dict_id_value": current_user.get('id') if isinstance(current_user, dict) else "NOT A DICT"
    }
