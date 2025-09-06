import httpx
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os
from app.models.currency import Currency, ExchangeRate

class CurrencyService:
    def __init__(self, db: Session):
        self.db = db
        self.openexchangerates_api_key = os.getenv('OPENEXCHANGERATES_API_KEY')

    async def get_latest_exchange_rate(self, base_currency: str, target_currency: str) -> Optional[float]:
        """Get the latest exchange rate, fetching from API if needed. Uses USD as the base for API calls."""
        if base_currency == target_currency:
            return 1.0

        # Check for cached rate (last 4 hours)
        cached_rate = self.get_cached_rate(base_currency, target_currency)
        if cached_rate:
            return cached_rate

        # Fetch from external API. ALWAYS use USD as the base for the API call.
        try:
            # The API only allows USD as base. We will fetch USD->base and USD->target rates.
            usd_to_base_rate = await self.fetch_usd_base_rate(base_currency)
            usd_to_target_rate = await self.fetch_usd_base_rate(target_currency)

            if usd_to_base_rate and usd_to_target_rate:
                # To get base->target rate, we calculate: (USD->Target) / (USD->Base)
                rate = usd_to_target_rate / usd_to_base_rate
                self.cache_rate(base_currency, target_currency, rate)
                return rate
        except Exception as e:
            print(f"Failed to fetch rate from API: {e}")

        # If all else fails, try to get the last known rate from the DB
        return self.get_last_known_rate(base_currency, target_currency)

    async def convert_amount(self, amount: float, from_currency: str, to_currency: str) -> float:
        """Convert amount between currencies - RAISES EXCEPTION on failure"""
        if from_currency == to_currency:
            return amount

        rate = await self.get_latest_exchange_rate(from_currency, to_currency)
        if rate is None:
            # CRITICAL CHANGE: Raise exception instead of silently continuing
            raise Exception(f"Failed to get exchange rate for {from_currency} to {to_currency}")
        return round(amount * rate, 2)

    def format_currency(self, amount: float, currency_code: str, locale: str = "en_US") -> str:
        """Professional currency formatting with localization"""
        currency = self.db.query(Currency).filter(Currency.code == currency_code).first()
        if not currency:
            return f"${amount:,.2f}"  # Fallback

        formatted_amount = self.format_amount(amount, currency.decimal_places)
        return self.apply_symbol_formatting(formatted_amount, currency)

    async def fetch_usd_base_rate(self, target_currency: str) -> Optional[float]:
        """Fetch live rate from OpenExchangeRates API (USD -> Target Currency)"""
        if not self.openexchangerates_api_key:
            return None
        if target_currency == 'USD':
            return 1.0

        try:
            async with httpx.AsyncClient() as client:
                # Note: The API base is fixed to USD. We are fetching the rate for the target currency.
                url = f"https://openexchangerates.org/api/latest.json?app_id={self.openexchangerates_api_key}"
                response = await client.get(url, timeout=10.0)
                data = response.json()

                if target_currency in data['rates']:
                    rate = float(data['rates'][target_currency])
                    # Store the rate in database (USD -> Target)
                    self.store_exchange_rate('USD', target_currency, rate)
                    return rate
                else:
                    print(f"Currency {target_currency} not found in API response.")
                    return None
        except Exception as e:
            print(f"OpenExchangeRates API error: {e}")
        return None

    def get_cached_rate(self, base: str, target: str, max_age_hours: int = 4) -> Optional[float]:
        """Get recently cached exchange rate"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        rate = self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == base,
            ExchangeRate.target_currency == target,
            ExchangeRate.effective_date >= cutoff_time,
            ExchangeRate.is_active == True
        ).order_by(ExchangeRate.effective_date.desc()).first()

        return float(rate.rate) if rate else None

    def cache_rate(self, base: str, target: str, rate: float):
        """Cache a new exchange rate in the database"""
        self.store_exchange_rate(base, target, rate)

    def store_exchange_rate(self, base: str, target: str, rate: float):
        """Store new exchange rate in database"""
        # Deactivate old rates
        self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == base,
            ExchangeRate.target_currency == target
        ).update({"is_active": False})

        # Add new rate
        new_rate = ExchangeRate(
            base_currency=base,
            target_currency=target,
            rate=rate,
            source="openexchangerates"
        )
        self.db.add(new_rate)
        self.db.commit()

    def get_last_known_rate(self, base: str, target: str) -> Optional[float]:
        """Get the last known rate as fallback - returns None if not found"""
        rate = self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == base,
            ExchangeRate.target_currency == target,
            ExchangeRate.is_active == True
        ).order_by(ExchangeRate.effective_date.desc()).first()

        return float(rate.rate) if rate else None

    def format_amount(self, amount: float, decimal_places: int) -> str:
        """Format amount with proper decimal places"""
        if decimal_places == 0:
            return f"{int(amount):,}"
        return f"{amount:,.{decimal_places}f}"

    def apply_symbol_formatting(self, amount_str: str, currency: Currency) -> str:
        """Apply currency symbol based on positioning rules"""
        if currency.symbol_position == "after":
            return f"{amount_str}{currency.symbol}"
        elif currency.symbol_position == "space_before":
            return f"{currency.symbol} {amount_str}"
        elif currency.symbol_position == "space_after":
            return f"{amount_str} {currency.symbol}"
        else:  # before (default)
            return f"{currency.symbol}{amount_str}"
