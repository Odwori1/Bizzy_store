from sqlalchemy.orm import Session
from typing import Optional
from app.crud.product import get_product_by_barcode, create_product
from app.schemas.product_schema import ProductCreate
from .external_api_service import external_api_service
from .analytics_service import analytics_service
import logging

logger = logging.getLogger(__name__)

class BarcodeService:
    """
    Service orchestrating the barcode lookup strategy:
    1. Local database lookup
    2. External API lookup (if not found locally)
    3. Save external results to local database
    """

    async def lookup_barcode(self, db: Session, barcode: str, user_id: Optional[int] = None):
        """
        Main barcode lookup method implementing the strategy.
        Returns product data if found, None otherwise.
        """
        logger.info(f"🔍 Starting lookup for barcode: {barcode}")

        # 1. Try local database first
        local_product = get_product_by_barcode(db, barcode)
        if local_product:
            logger.info(f"✅ Product found in local database: {local_product.name}")
            # Track successful local scan
            await analytics_service.track_scan_event(
                db, barcode, True, "local_database", user_id
            )
            return self._format_db_product(local_product)

        # 2. If not found locally, try external API
        logger.info(f"ℹ️ Product not found locally. Trying external lookup for: {barcode}")
        external_product_data = await external_api_service.lookup_barcode(barcode)
        
        if external_product_data:
            # 3. Save external product to local database
            logger.info(f"💾 Saving external product to local database: {external_product_data['name']}")
            try:
                product_create = ProductCreate(**external_product_data)
                saved_product = create_product(db, product_create)
                db.commit()
                db.refresh(saved_product)
                logger.info(f"✅ Successfully saved product: {saved_product.name} with ID: {saved_product.id}")
                # Track successful external scan
                await analytics_service.track_scan_event(
                    db, barcode, True, "external_api", user_id
                )
                return self._format_db_product(saved_product)
            except Exception as e:
                logger.error(f"❌ Failed to save external product to database: {e}")
                db.rollback()
                # Track failed external scan (found externally but couldn't save)
                await analytics_service.track_scan_event(
                    db, barcode, False, "external_api", user_id
                )
                return external_product_data

        # 4. Product not found anywhere
        logger.info(f"❌ Product not found in any database for barcode: {barcode}")
        # Track failed scan
        await analytics_service.track_scan_event(
            db, barcode, False, "not_found", user_id
        )
        return None

    def _format_db_product(self, db_product):
        """Format database product object into response dictionary."""
        return {
            "id": db_product.id,
            "name": db_product.name,
            "description": db_product.description,
            "price": float(db_product.price),
            "barcode": db_product.barcode,
            "stock_quantity": db_product.stock_quantity,
            "min_stock_level": db_product.min_stock_level,
            "source": "local_database"
        }

# Create a singleton instance
barcode_service = BarcodeService()
