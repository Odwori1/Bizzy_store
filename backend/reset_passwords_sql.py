import sys
sys.path.append('.')

from app.database import engine
from passlib.context import CryptContext

# Use the same password context as your application
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_passwords_sql():
    """Reset passwords using raw SQL to avoid ORM issues"""
    
    # Hash the passwords
    cashier_hash = pwd_context.hash("cashier123")
    test_hash = pwd_context.hash("test123")
    
    # SQL statements to update passwords
    sql_statements = [
        f"UPDATE users SET hashed_password = '{cashier_hash}' WHERE email = 'cashier@example.com';",
        f"UPDATE users SET hashed_password = '{test_hash}' WHERE email = 'test@example.com';"
    ]
    
    try:
        with engine.connect() as connection:
            for sql in sql_statements:
                result = connection.execute(sql)
                print(f"✅ Executed: {sql}")
                print(f"   Rows affected: {result.rowcount}")
            
            connection.commit()
        
        print("\n🎉 Passwords reset successfully using SQL!")
        print("\n📋 Login Credentials:")
        print("====================")
        print("Email: cashier@example.com")
        print("Password: cashier123")
        print("---")
        print("Email: test@example.com")
        print("Password: test123")
        print("---")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_passwords_sql()
