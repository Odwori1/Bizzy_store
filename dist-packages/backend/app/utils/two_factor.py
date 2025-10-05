import pyotp
import qrcode
import base64
from io import BytesIO
from typing import List
import secrets

def generate_totp_secret() -> str:
    """Generate a base32 secret for TOTP"""
    return pyotp.random_base32()

def generate_totp_uri(secret: str, email: str, issuer: str = "Bizzy POS") -> str:
    """Generate TOTP URI for QR code"""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)

def generate_qr_code(uri: str) -> str:
    """Generate QR code as base64 data URL"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

def verify_totp_code(secret: str, code: str) -> bool:
    """Verify TOTP code"""
    totp = pyotp.TOTP(secret)
    return totp.verify(code)

def generate_backup_codes(count: int = 10) -> List[str]:
    """Generate backup codes for 2FA"""
    return [secrets.token_hex(4).upper() for _ in range(count)]
