from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import requires_permission
from app.services.analytics_service import analytics_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
)

@router.get("/daily-scans", dependencies=[Depends(requires_permission("report:view"))])
async def get_daily_scan_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get daily scan statistics for the current user's business.
    Returns data for building charts on the analytics dashboard.
    """
    try:
        logger.info(f"📈 Fetching daily scan stats for user: {current_user['id']}, business: {current_user['business_id']}")

        daily_stats = analytics_service.get_daily_scan_stats(db, business_id=current_user["business_id"])

        stats_list = [
            {"date": str(stat[0]), "scan_count": stat[1]}
            for stat in daily_stats
        ]

        return {"success": True, "data": stats_list}

    except Exception as e:
        logger.error(f"❌ Error fetching daily scan stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch scan statistics")

@router.get("/user-activity", dependencies=[Depends(requires_permission("report:view"))])
async def get_user_activity_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user activity statistics for the current user's business.
    Returns data showing which users are performing the most scans.
    """
    try:
        logger.info(f"📊 Fetching user activity stats for business: {current_user['business_id']}")

        user_stats = analytics_service.get_user_activity_stats(db, business_id=current_user["business_id"])

        stats_list = [
            {"user_id": stat[0], "username": stat[1], "scan_count": stat[2]}
            for stat in user_stats
        ]

        return {"success": True, "data": stats_list}

    except Exception as e:
        logger.error(f"❌ Error fetching user activity stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user activity statistics")
