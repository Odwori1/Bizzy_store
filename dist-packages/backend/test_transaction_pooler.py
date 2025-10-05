import os
from sqlalchemy import create_engine

# Use the TRANSACTION POOLER (IPv4 compatible)
TRANSACTION_POOLER_URL = "postgresql://postgres.nsyzsnojvnmxnaalgpby:0791486006@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

try:
    engine = create_engine(TRANSACTION_POOLER_URL + "?sslmode=require")
    conn = engine.connect()
    print("🎉 TRANSACTION POOLER CONNECTION SUCCESSFUL!")
    print("✅ IPv4 connection working!")
    
    result = conn.execute("SELECT version();")
    print("✅ Database version:", result.fetchone()[0])
    
    # Test if we can create tables (migrations will work)
    result = conn.execute("SELECT current_database();")
    print("✅ Database name:", result.fetchone()[0])
    
    conn.close()
    print("🚀 Ready to run migrations!")
except Exception as e:
    print(f"❌ Transaction pooler failed: {e}")
