import psycopg2
from passlib.context import CryptContext

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="bizzy_pos_db",
    user="pos_user",
    password="0791486006"
)

# Password hashing
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def fix_all_passwords():
    users_passwords = {
        'cashier1': 'cashier123',
        'testuser': 'testuser123',
        'newuser': 'newuser123'
    }
    
    for username, password in users_passwords.items():
        # Generate proper hash
        password_hash = pwd_context.hash(password)
        print(f"Updating {username}: {password_hash}")
        
        # Update database using parameterized query
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET hashed_password = %s WHERE username = %s",
                (password_hash, username)
            )
            conn.commit()
            print(f"✅ Updated {username}")
            
            # Verify the update
            cur.execute(
                "SELECT username, hashed_password, LENGTH(hashed_password) as length FROM users WHERE username = %s",
                (username,)
            )
            row = cur.fetchone()
            if row:
                print(f"✅ Stored hash: {row[1]}")
                print(f"✅ Hash length: {row[2]}")
                print(f"✅ Valid hash: {row[1].startswith('$2b$12$')}")

if __name__ == "__main__":
    fix_all_passwords()
    conn.close()
