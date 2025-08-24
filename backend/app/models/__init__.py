# Import all models here so that they are available before the relationships are set up
from .base import Base, metadata
from .user import User
from .product import Product
from .inventory import InventoryHistory
from .sale import Sale, SaleItem  # ADD THESE TWO LINES
from .payment import Payment       # ADD THIS LINE
from .business import Business  # ADD THIS LINE

# This ensures all models are imported and their relationships can be resolved
__all__ = ['Base', 'metadata', 'User', 'Product', 'InventoryHistory', 'Sale', 'SaleItem', 'Payment', 'Business']
