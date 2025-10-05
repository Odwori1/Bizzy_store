from sqlalchemy.orm import Session
from typing import Optional
from app.models.analytics import BarcodeScanEvent
from app.schemas.analytics_schema import BarcodeScanEventCreate

def create_scan_event(db: Session, event: BarcodeScanEventCreate, user_id: Optional[int] = None):
    """Create a new barcode scan event record"""
    db_event = BarcodeScanEvent(
        barcode=event.barcode,
        success=event.success,
        source=event.source,
        user_id=user_id,
        session_id=event.session_id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_scan_events(db: Session, skip: int = 0, limit: int = 100):
    """Get scan events with pagination"""
    return db.query(BarcodeScanEvent).offset(skip).limit(limit).all()

def get_scan_events_by_barcode(db: Session, barcode: str):
    """Get all scan events for a specific barcode"""
    return db.query(BarcodeScanEvent).filter(BarcodeScanEvent.barcode == barcode).all()

def get_scan_events_by_user(db: Session, user_id: int):
    """Get all scan events for a specific user"""
    return db.query(BarcodeScanEvent).filter(BarcodeScanEvent.user_id == user_id).all()

def get_scan_stats(db: Session):
    """Get basic scan statistics"""
    total_scans = db.query(BarcodeScanEvent).count()
    successful_scans = db.query(BarcodeScanEvent).filter(BarcodeScanEvent.success == True).count()
    failed_scans = total_scans - successful_scans
    
    return {
        "total_scans": total_scans,
        "successful_scans": successful_scans,
        "failed_scans": failed_scans,
        "success_rate": (successful_scans / total_scans * 100) if total_scans > 0 else 0
    }
