import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Convert postgresql:// to connection parameters
# postgresql://pos_user:0791486006@localhost/bizzy_pos_db
db_params = DATABASE_URL.replace('postgresql://', '').split('@')
user_pass, host_db = db_params
user, password = user_pass.split(':')
host, db_name = host_db.split('/')

conn = psycopg2.connect(
    host=host,
    database=db_name,
    user=user,
    password=password
)

cur = conn.cursor()
cur.execute("UPDATE sale_items SET refunded_quantity = 0 WHERE refunded_quantity IS NULL")
updated_rows = cur.rowcount
conn.commit()
print(f"Updated {updated_rows} rows")

cur.close()
conn.close()
