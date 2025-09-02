from pydantic import BaseModel, EmailStr, validator
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
    #role: str
    created_at: Optional[datetime] = None  # ← Changed to Optional
    permissions: List[str] = []
    role_name: Optional[str] = None

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    #role: str = 'cashier'  # Default role for new registrations

    # Validator to ensure role is one of the allowed values
    #@validator('role')
    #def validate_role(cls, v):
       # allowed_roles = ['admin', 'manager', 'cashier']
        #if v not in allowed_roles:
            #raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        #return v

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



# --- ADD THIS NEW SCHEMA FOR 2FA LOGIN FLOW ---
class TwoFactorRequiredResponse(BaseModel):
    requires_2fa: bool = True
    message: str = "2FA verification required"
    temp_token: str  # We'll use this later to remember the user
