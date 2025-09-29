from sqlalchemy.orm import Session
from sqlalchemy import func, Date
from typing import Optional, List, Tuple
from app.models.analytics import BarcodeScanEvent
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """
    Service for tracking barcode scan events and analytics.
    Follows the direct database access pattern used in other services.
    """

    async def track_scan_event(
        self,
        db: Session,
        barcode: str,
        success: bool,
        source: str,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None,
        business_id: Optional[int] = None
    ):
        """
        Track a barcode scan event for analytics.
        Directly creates the event in the database.
        """
        try:
            # Create new scan event object
            scan_event = BarcodeScanEvent(
                barcode=barcode,
                success=success,
                source=source,
                user_id=user_id,
                session_id=session_id,
                business_id=business_id
            )

            # Add to database and commit
            db.add(scan_event)
            db.commit()
            db.refresh(scan_event)

            logger.info(f"📊 Tracked scan event: {barcode}, success: {success}, source: {source}, business: {business_id}")
            return scan_event

        except Exception as e:
            logger.error(f"❌ Failed to track scan event: {e}")
            db.rollback()
            return None

    def get_daily_scan_stats(self, db: Session, business_id: int = None) -> List[Tuple[Date, int]]:
        """
        Get daily scan statistics for a specific business.
        Returns a list of tuples: (date, scan_count) for each day.
        """
        try:
            query = db.query(
                func.date(BarcodeScanEvent.created_at).label('scan_date'),
                func.count(BarcodeScanEvent.id).label('scan_count')
            )
            
            if business_id is not None:
                query = query.filter(BarcodeScanEvent.business_id == business_id)
            
            daily_stats = query.group_by(
                func.date(BarcodeScanEvent.created_at)
            ).order_by(
                func.date(BarcodeScanEvent.created_at)
            ).all()

            return daily_stats

        except Exception as e:
            logger.error(f"❌ Failed to fetch daily scan stats: {e}")
            return []

    def get_user_activity_stats(self, db: Session, business_id: int = None) -> List[Tuple[int, str, int]]:
        """
        Get user activity statistics (scan counts per user) for a specific business.
        Returns a list of tuples: (user_id, username, scan_count).
        """
        try:
            from app.models.user import User
            
            query = db.query(
                BarcodeScanEvent.user_id,
                User.username,
                func.count(BarcodeScanEvent.id).label('scan_count')
            ).join(User, BarcodeScanEvent.user_id == User.id)
            
            if business_id is not None:
                query = query.filter(BarcodeScanEvent.business_id == business_id)
            
            user_stats = query.group_by(
                BarcodeScanEvent.user_id, User.username
            ).order_by(
                func.count(BarcodeScanEvent.id).desc()
            ).all()

            return user_stats

        except Exception as e:
            logger.error(f"❌ Failed to fetch user activity stats: {e}")
            return []


# Create a singleton instance
analytics_service = AnalyticsService()
