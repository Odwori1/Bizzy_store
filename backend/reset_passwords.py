import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

# Use the same password context as your application
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_all_passwords():
    """Reset passwords for all users in the database"""
    db = SessionLocal()
    try:
        # Get all users
        users = db.query(User).all()
        print(f"Found {len(users)} users:")
        
        for user in users:
            print(f"  - ID: {user.id}, Email: {user.email}, Username: {user.username}")
            
            # Set appropriate password based on email
            if user.email == "cashier@example.com":
                new_password = "cashier123"
            elif user.email == "test@example.com":
                new_password = "test123"
            else:
                new_password = "password123"
            
            # Hash and update the password
            user.hashed_password = pwd_context.hash(new_password)
            print(f"    ✅ Password reset to: {new_password}")
        
        db.commit()
        print("\n🎉 All passwords reset successfully!")
        print("\n📋 Login Credentials:")
        print("====================")
        for user in users:
            if user.email == "cashier@example.com":
                print(f"Email: cashier@example.com")
                print(f"Password: cashier123")
                print(f"Role: {user.role}")
                print("---")
            elif user.email == "test@example.com":
                print(f"Email: test@example.com")
                print(f"Password: test123") 
                print(f"Role: {user.role}")
                print("---")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_all_passwords()
