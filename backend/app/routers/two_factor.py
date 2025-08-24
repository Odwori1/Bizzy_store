from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.user import User  # ADD THIS IMPORT

from app.database import get_db
from app.core.auth import get_current_user
from app.schemas.user_schema import (
    TwoFactorSetupResponse, 
    TwoFactorVerifyRequest,
    TwoFactorBackupRequest,
    TwoFactorStatusResponse
)
from app.utils.two_factor import (
    generate_totp_secret,
    generate_totp_uri,
    generate_qr_code,
    verify_totp_code,
    generate_backup_codes
)
from app.crud.user import update_user

router = APIRouter(
    prefix="/api/2fa",
    tags=["two-factor-auth"]
)

@router.post("/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Initiate 2FA setup for the current user.
    Returns QR code URL and backup codes.
    """
    # Generate new secret and backup codes
    secret = generate_totp_secret()
    backup_codes = generate_backup_codes()
    
    # Generate TOTP URI and QR code
    totp_uri = generate_totp_uri(secret, current_user["email"])
    qr_code_url = generate_qr_code(totp_uri)
    
    # Save secret and backup codes to user (but don't enable 2FA yet)
    update_data = {
        "two_factor_secret": secret,
        "two_factor_backup_codes": backup_codes
    }
    
    updated_user = update_user(db, current_user["id"], update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to setup 2FA"
        )
    
    return TwoFactorSetupResponse(
        qr_code_url=qr_code_url,
        secret_key=secret,
        backup_codes=backup_codes
    )

@router.post("/verify", response_model=TwoFactorStatusResponse)
async def verify_2fa_setup(
    request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Verify 2FA setup with a TOTP code.
    Enables 2FA if verification is successful.
    """
    user = db.query(User).filter(User.id == current_user["id"]).first()
    
    if not user or not user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not setup yet"
        )
    
    # Verify the TOTP code
    if not verify_totp_code(user.two_factor_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Enable 2FA
    update_data = {"two_factor_enabled": True}
    updated_user = update_user(db, current_user["id"], update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enable 2FA"
        )
    
    return TwoFactorStatusResponse(is_enabled=True)

@router.post("/disable", response_model=TwoFactorStatusResponse)
async def disable_2fa(
    request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Disable 2FA for the current user.
    Requires a valid TOTP code for security.
    """
    user = db.query(User).filter(User.id == current_user["id"]).first()
    
    if not user or not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    # Verify the TOTP code before disabling
    if not verify_totp_code(user.two_factor_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Disable 2FA and clear sensitive data
    update_data = {
        "two_factor_enabled": False,
        "two_factor_secret": None,
        "two_factor_backup_codes": None
    }
    
    updated_user = update_user(db, current_user["id"], update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable 2FA"
        )
    
    return TwoFactorStatusResponse(is_enabled=False)

@router.post("/backup-verify", response_model=TwoFactorStatusResponse)
async def verify_with_backup_code(
    request: TwoFactorBackupRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Verify using a backup code.
    Useful when the user loses access to their authenticator app.
    """
    user = db.query(User).filter(User.id == current_user["id"]).first()
    
    if not user or not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    if not user.two_factor_backup_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No backup codes available"
        )
    
    # Check if backup code is valid
    if request.backup_code not in user.two_factor_backup_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid backup code"
        )
    
    # Remove the used backup code
    updated_backup_codes = [code for code in user.two_factor_backup_codes if code != request.backup_code]
    
    update_data = {"two_factor_backup_codes": updated_backup_codes}
    updated_user = update_user(db, current_user["id"], update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update backup codes"
        )
    
    return TwoFactorStatusResponse(is_enabled=True)

@router.get("/status", response_model=TwoFactorStatusResponse)
async def get_2fa_status(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current 2FA status for the user.
    """
    user = db.query(User).filter(User.id == current_user["id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # FIX: Handle None value by defaulting to False
    is_enabled = user.two_factor_enabled if user.two_factor_enabled is not None else False
    
    return TwoFactorStatusResponse(is_enabled=is_enabled)
