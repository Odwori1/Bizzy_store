import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models.user import User
from app.core.auth import get_password_hash

def reset_cashier_password():
    db = SessionLocal()
    try:
        # Find the cashier user
        user = db.query(User).filter(User.email == "cashier@example.com").first()
        if user:
            # Reset password to "cashier123"
            user.hashed_password = get_password_hash("cashier123")
            db.commit()
            print("✅ Password reset successfully!")
            print(f"📧 Email: cashier@example.com")
            print(f"🔑 New password: cashier123")
            print(f"👤 Username: cashier1")
            print(f"🎯 Role: cashier")
        else:
            print("❌ User cashier@example.com not found")
            
    except Exception as e:
        print(f"❌ Error resetting password: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_cashier_password()
