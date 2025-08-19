from .base import Base, metadata
from .user import User
from .product import Product  # Add this line
from .inventory import InventoryHistory

__all__ = ['Base', 'metadata', 'User', 'Product', 'InventoryHistory']  # Add Product
