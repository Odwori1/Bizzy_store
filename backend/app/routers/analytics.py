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
    Get daily scan statistics.
    Returns data for building charts on the analytics dashboard.
    """
    try:
        logger.info(f"📈 Fetching daily scan stats for user: {current_user['id']}")

        # Get the statistics from the service
        daily_stats = analytics_service.get_daily_scan_stats(db)

        # Format the data for the frontend response
        # The service returns a list of tuples: [(date, count), ...]
        stats_list = [
            {"date": str(stat[0]), "scan_count": stat[1]}
            for stat in daily_stats
        ]

        return {"success": True, "data": stats_list}

    except Exception as e:  # <--- THIS WAS MISSING
        logger.error(f"Unexpected error in analytics endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching analytics")

@router.get("/user-activity", dependencies=[Depends(requires_permission("report:view"))])
async def get_user_activity_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user activity statistics.
    Returns data showing which users are performing the most scans.
    """
    try:
        logger.info(f"📊 Fetching user activity stats for user: {current_user['id']}")

        # Get the statistics from the service
        user_stats = analytics_service.get_user_activity_stats(db)

        # Format the data for the frontend response
        # The service returns a list of tuples: [(user_id, username, scan_count), ...]
        stats_list = [
            {"user_id": stat[0], "username": stat[1], "scan_count": stat[2]}
            for stat in user_stats
        ]

        return {"success": True, "data": stats_list}

    except Exception as e:
        logger.error(f"Unexpected error in user activity endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching user activity")
