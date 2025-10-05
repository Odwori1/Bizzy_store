import os
from sqlalchemy import create_engine

# Use the EXACT format from Supabase documentation
# Format: postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
TRANSACTION_URL = "postgres://postgres.nsyzsnojvnmxnaalgpby:0791486006@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

try:
    engine = create_engine(TRANSACTION_URL + "?sslmode=require")
    conn = engine.connect()
    print("🎉 TRANSACTION POOLER CONNECTION SUCCESSFUL!")
    
    result = conn.execute("SELECT version();")
    print("✅ Database version:", result.fetchone()[0])
    
    # Check current tables
    result = conn.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = [row[0] for row in result.fetchall()]
    print("✅ Current tables:", len(tables), "tables")
    
    conn.close()
    print("🚀 Ready for migrations!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
