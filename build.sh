#!/bin/bash
set -e

echo "🔨 Building Bizzy POS..."
echo "========================="

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📱 Building frontend PWA..."
cd "$SCRIPT_DIR/frontend"
npm ci
npm run build
cd "$SCRIPT_DIR"

# Create output directory
echo "📦 Creating distribution package..."
rm -rf "$SCRIPT_DIR/dist-packages"
mkdir -p "$SCRIPT_DIR/dist-packages"

# Copy built files
echo "📁 Copying files..."
cp -r "$SCRIPT_DIR/frontend/dist" "$SCRIPT_DIR/dist-packages/frontend"
cp -r "$SCRIPT_DIR/backend" "$SCRIPT_DIR/dist-packages/backend"

# Clean up Python cache files
echo "🧹 Cleaning up..."
find "$SCRIPT_DIR/dist-packages/backend" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find "$SCRIPT_DIR/dist-packages/backend" -name "*.pyc" -delete 2>/dev/null || true

# Copy production environment file
if [ -f "$SCRIPT_DIR/backend/.env.production" ]; then
    cp "$SCRIPT_DIR/backend/.env.production" "$SCRIPT_DIR/dist-packages/backend/"
    echo "✅ Production environment file copied"
else
    echo "⚠️  No .env.production file found - using development settings"
fi

# Create installation instructions
cat > "$SCRIPT_DIR/dist-packages/INSTALL.md" << 'EOF'
# Bizzy POS Installation Guide

## Backend Setup
1. Copy the backend folder to your server
2. Create a Python virtual environment: `python3 -m venv venv`
3. Activate venv: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Set up PostgreSQL database and update DATABASE_URL in .env.production
6. Run: `./start-production.sh`

## Frontend Setup
1. Copy frontend folder to your web server (nginx/Apache)
2. Configure server to serve index.html for all routes (SPA)
3. Ensure HTTPS is enabled for PWA installation
4. Update VITE_API_URL in your build to point to your backend

## Mobile Apps
1. Android: Open frontend/android/ in Android Studio
2. Build signed APK for release
EOF

echo "✅ Build completed!"
echo ""
echo "📦 Distribution package created at: $SCRIPT_DIR/dist-packages"
echo "🚀 To test PWA locally: cd $SCRIPT_DIR/frontend && npx serve dist -p 3001"
echo "🔧 Backend: cd $SCRIPT_DIR/dist-packages/backend && ./start-production.sh"
