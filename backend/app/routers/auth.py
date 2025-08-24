from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets

from app.core.auth import create_access_token, verify_password, oauth2_scheme
from app.crud.user import get_user_by_email_or_username, get_user_by_email, update_user
from app.database import get_db
from app.schemas.user_schema import Token, UserLogin, PasswordResetRequest, PasswordResetConfirm
from app.utils.email import send_password_reset_email
from app.models.user import User

router = APIRouter(
    prefix="/api",
    tags=["auth"]
)

@router.post("/auth/token", response_model=Token)
def login_for_token(login_data: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email_or_username(db, login_data.identifier)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled. Please contact administrator.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/login-oauth", response_model=Token)
def login_oauth(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email_or_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    # DEBUG: Print the incoming request
    print(f"DEBUG: Password reset request for email: {request.email}")
    
    user = get_user_by_email(db, request.email)

    if not user:
        print(f"DEBUG: User not found for email: {request.email}")
        print(f"Password reset requested for non-existent email: {request.email}")
        return {"msg": "If the email is registered, a password reset link has been sent."}

    print(f"DEBUG: Found user - ID: {user.id}, Email: {user.email}, Active: {user.is_active}")

    if not user.is_active:
        print(f"DEBUG: User account is disabled, cannot reset password")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is disabled. Please contact administrator."
        )

    reset_token = secrets.token_urlsafe(16)
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)

    print(f"DEBUG: Generated token: {reset_token}")
    print(f"DEBUG: Token expires at: {reset_token_expires}")

    user_update_data = {
        "reset_token": reset_token,
        "reset_token_expires": reset_token_expires
    }

    print(f"DEBUG: Sending update data to update_user: {user_update_data}")

    updated_user = update_user(db, user.id, user_update_data)

    if not updated_user:
        print(f"DEBUG: update_user returned None - update failed!")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not process password reset request."
        )

    print(f"DEBUG: User updated successfully.")

    email_sent = send_password_reset_email(
        email_to=user.email,
        username=user.username,
        reset_token=reset_token
    )

    if not email_sent:
        print(f"ERROR: Failed to send password reset email to {user.email}")
    else:
        print(f"DEBUG: Password reset email sent successfully to {user.email}")

    return {"msg": "If the email is registered, a password reset link has been sent."}

@router.post("/auth/reset-password")
async def reset_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == request.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
    
    if user.reset_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired."
        )
    
    user_update_data = {
        "password": request.new_password,
        "reset_token": None,
        "reset_token_expires": None
    }
    
    updated_user = update_user(db, user.id, user_update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not reset password."
        )
    
    return {"msg": "Password has been reset successfully."}
