import httpx
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class ExternalAPIService:
    """
    Service to handle external barcode API lookups (Open Food Facts).
    """

    async def lookup_barcode(self, barcode: str):
        """
        Look up a barcode in the Open Food Facts API.
        Returns product data if found, None otherwise.
        """
        url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                response.raise_for_status()
                data = response.json()

            if data.get("status") == 1 and data.get("product"):
                product_data = data["product"]
                logger.info(f"Product found in Open Food Facts: {product_data.get('product_name', 'Unknown')}")
                return self._format_product_data(barcode, product_data)
            else:
                logger.info(f"Product not found in Open Food Facts for barcode: {barcode}")
                return None

        except httpx.RequestError as e:
            logger.error(f"Network error during external API lookup for {barcode}: {e}")
            raise HTTPException(status_code=503, detail="External product database unavailable")
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during external API lookup for {barcode}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during external API lookup for {barcode}: {e}")
            return None

    def _format_product_data(self, barcode: str, product_data: dict):
        """Format Open Food Facts data into our internal product schema."""
        return {
            "name": product_data.get("product_name", "Unknown Product"),
            "description": self._get_description(product_data),
            "price": 1.0,  # Open Food Facts doesn't provide price
            "barcode": barcode,
            "stock_quantity": 0,  # External API doesn't provide stock
            "min_stock_level": 5  # Default value
        }

    def _get_description(self, product_data: dict):
        """Extract a description from product data."""
        # Try several possible fields for description
        possible_fields = [
            "generic_name",
            "brands",
            "categories",
            "quantity"
        ]
        
        description_parts = []
        for field in possible_fields:
            if field in product_data and product_data[field]:
                description_parts.append(str(product_data[field]))
        
        return " | ".join(description_parts) if description_parts else "No description available"

# Create a singleton instance
external_api_service = ExternalAPIService()
