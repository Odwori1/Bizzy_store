# Comprehensive currency database with UGX support
CURRENCY_MAP = {
    "US": {"code": "USD", "symbol": "$", "name": "US Dollar", "decimal_places": 2, "format": "symbol-first"},
    "UG": {"code": "UGX", "symbol": "USh", "name": "Ugandan Shilling", "decimal_places": 0, "format": "symbol-first"},  # ADDED UGX
    "KE": {"code": "KES", "symbol": "KSh", "name": "Kenyan Shilling", "decimal_places": 2, "format": "symbol-first"},
    "NG": {"code": "NGN", "symbol": "₦", "name": "Nigerian Naira", "decimal_places": 2, "format": "symbol-first"},
    "GB": {"code": "GBP", "symbol": "£", "name": "British Pound", "decimal_places": 2, "format": "symbol-first"},
    "FR": {"code": "EUR", "symbol": "€", "name": "Euro", "decimal_places": 2, "format": "symbol-last"},
    "DE": {"code": "EUR", "symbol": "€", "name": "Euro", "decimal_places": 2, "format": "symbol-last"},
    "IN": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "decimal_places": 2, "format": "symbol-first"},
    "JP": {"code": "JPY", "symbol": "¥", "name": "Japanese Yen", "decimal_places": 0, "format": "symbol-first"},
    "CN": {"code": "CNY", "symbol": "¥", "name": "Chinese Yuan", "decimal_places": 2, "format": "symbol-first"},
    "BR": {"code": "BRL", "symbol": "R$", "name": "Brazilian Real", "decimal_places": 2, "format": "symbol-first"},
}

COUNTRIES = [
    {"code": "US", "name": "United States", "currency": "USD"},
    {"code": "UG", "name": "Uganda", "currency": "UGX"},  # ADDED Uganda
    {"code": "KE", "name": "Kenya", "currency": "KES"},
    {"code": "NG", "name": "Nigeria", "currency": "NGN"},
    {"code": "GB", "name": "United Kingdom", "currency": "GBP"},
    {"code": "FR", "name": "France", "currency": "EUR"},
    {"code": "DE", "name": "Germany", "currency": "EUR"},
    {"code": "IN", "name": "India", "currency": "INR"},
    {"code": "JP", "name": "Japan", "currency": "JPY"},
    {"code": "CN", "name": "China", "currency": "CNY"},
    {"code": "BR", "name": "Brazil", "currency": "BRL"},
]

def get_currency_by_country(country_code: str):
    """Get currency info by country code"""
    return CURRENCY_MAP.get(country_code.upper(), CURRENCY_MAP["US"])

def format_currency(amount: float, currency_data: dict) -> str:
    """Format amount according to currency conventions"""
    # Handle decimal places
    if currency_data['decimal_places'] == 0:
        formatted_amount = format(int(amount), ",")
    else:
        formatted_amount = format(amount, f",.{currency_data['decimal_places']}f")
    
    # Apply formatting based on currency style
    if currency_data['format'] == "symbol-last":
        return f"{formatted_amount} {currency_data['symbol']}"
    elif currency_data['format'] == "space-separated":
        return f"{currency_data['symbol']} {formatted_amount}"
    else:  # symbol-first (default)
        return f"{currency_data['symbol']}{formatted_amount}"

def get_all_countries():
    """Get list of all supported countries"""
    return COUNTRIES

def get_all_currencies():
    """Get list of all unique currencies"""
    unique_currencies = {}
    for data in CURRENCY_MAP.values():
        if data['code'] not in unique_currencies:
            unique_currencies[data['code']] = data
    return list(unique_currencies.values())
