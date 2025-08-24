from pydantic import BaseModel, EmailStr
from typing import Optional,  List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: Optional[datetime] = None  # ← Changed to Optional

    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    identifier: str  # Changed from email to identifier
    password: str

# --- ADD THESE NEW SCHEMAS FOR PASSWORD RESET ---
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# --- ADD THESE NEW SCHEMAS FOR 2FA ---
class TwoFactorSetupResponse(BaseModel):
    qr_code_url: str
    secret_key: str
    backup_codes: List[str]

class TwoFactorVerifyRequest(BaseModel):
    code: str

class TwoFactorBackupRequest(BaseModel):
    backup_code: str

class TwoFactorStatusResponse(BaseModel):
    is_enabled: bool
