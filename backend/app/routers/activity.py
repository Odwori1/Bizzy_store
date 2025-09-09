from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/api/activity", tags=["activity"])  # Note: added /api prefix

@router.get("/recent")
def get_recent_activities(
    hours: int = 24,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get recent business activities"""
    try:
        activities = ActivityService.get_recent_activities(db, hours, limit)
        return {"activities": activities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activities: {str(e)}")
