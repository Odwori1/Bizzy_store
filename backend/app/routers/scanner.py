from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.barcode_service import barcode_service
from app.core.auth import get_current_user
from app.core.permissions import requires_permission
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/scanner",
    tags=["scanner"],
)

# Define a Pydantic model for the request body
class ScanRequest(BaseModel):
    barcode: str

@router.post("/scan")
async def scan_barcode(
    request: ScanRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Scan a barcode using the intelligent lookup strategy:
    1. Local database → 2. External API → 3. Save to database
    """
    barcode = request.barcode

    if not barcode or not barcode.strip():
        raise HTTPException(status_code=400, detail="Barcode is required")

    # Clean the barcode (remove non-digit characters)
    clean_barcode = ''.join(filter(str.isdigit, barcode))
    if not clean_barcode:
        raise HTTPException(status_code=400, detail="Barcode must contain numbers")

    logger.info(f"📦 Scanner endpoint called with barcode: {clean_barcode}")

    try:
        # Pass the user_id to the barcode service for analytics tracking
        result = await barcode_service.lookup_barcode(db, clean_barcode, current_user["id"])

        if result:
            return {
                "success": True,
                "product": result
            }
        else:
            return {
                "success": False,
                "error": "Product not found in local database or external APIs"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in scanner endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during barcode scan")
