from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from app.services.activity_service import ActivityService
from app.schemas.activity_schema import ActivityResponse

router = APIRouter(prefix="/api/activity", tags=["activity"])

@router.get("/recent", response_model=ActivityResponse)
def get_recent_activities(
    hours: int = 24,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get recent business activities for the current user's business"""
    try:
        # 🚨 CRITICAL FIX: Pass business_id to the service
        activities = ActivityService.get_recent_activities(
            db, 
            business_id=current_user["business_id"],  # Pass the business_id from current_user
            hours=hours, 
            limit=limit
        )
        return {"activities": activities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activities: {str(e)}")
