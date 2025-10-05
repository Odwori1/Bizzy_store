#!/bin/bash
set -e

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Bizzy POS Backend in Production Mode..."
echo "===================================================="

# Check if we're in a virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Not in a virtual environment. Activating..."
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        echo "❌ Virtual environment not found. Please create one first:"
        echo "   python3 -m venv venv"
        echo "   source venv/bin/activate"
        echo "   pip install -r requirements.txt"
        exit 1
    fi
fi

# Use production environment file if it exists
if [ -f ".env.production" ]; then
    echo "📁 Using production environment configuration"
    set -a  # automatically export all variables
    source .env.production
    set +a
elif [ -f ".env" ]; then
    echo "⚠️  Using development environment configuration"
    set -a
    source .env
    set +a
else
    echo "❌ No environment file found!"
    echo "   Please create .env.production or .env with your settings"
    exit 1
fi

# Verify database connection
echo "🔍 Checking database configuration..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set!"
    exit 1
else
    echo "✅ Database URL configured"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

# Start the production server
echo "🌐 Starting Uvicorn server..."
echo "   Host: 0.0.0.0"
echo "   Port: 8000"
echo "   Workers: 4"
echo "   Environment: production"

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --proxy-headers \
    --forwarded-allow-ips "*"
