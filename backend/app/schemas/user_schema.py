from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime  # Add this import

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
    created_at: datetime  # Add this field

    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Add this schema for login
class UserLogin(BaseModel):
    email: EmailStr
    password: str
