#!/bin/bash

set -e

echo "🚀 Bizzy POS - Cross-Platform Build System"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"
OUTPUT_DIR="./dist-packages"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Python 3 is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All prerequisites satisfied${NC}"
}

# Function to build frontend PWA
build_frontend() {
    echo -e "${YELLOW}Building PWA frontend...${NC}"
    
    cd "$FRONTEND_DIR"
    
    # Build for production
    npm run build
    
    # Verify build was created
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ Frontend build failed - dist folder not found${NC}"
        exit 1
    fi
    
    cd ..
    
    echo -e "${GREEN}✓ PWA frontend build completed${NC}"
}

# Function to prepare mobile app
prepare_mobile() {
    echo -e "${YELLOW}Preparing mobile app...${NC}"
    
    cd "$FRONTEND_DIR"
    
    # Sync with Capacitor
    npx cap sync
    
    echo -e "${GREEN}✓ Mobile app preparation completed${NC}"
    echo -e "${YELLOW}Next: Open Android Studio or Xcode to build mobile apps${NC}"
}

# Function to create distribution package
create_package() {
    echo -e "${YELLOW}Creating distribution package...${NC}"
    
    # Clean output directory
    rm -rf "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
    
    # Copy frontend build - use absolute path
    echo "Copying frontend build..."
    cp -r "./frontend/dist" "$OUTPUT_DIR/frontend"
    
    # Copy backend
    echo "Copying backend..."
    cp -r "./backend" "$OUTPUT_DIR/backend"
    
    # Clean backend copy
    rm -rf "$OUTPUT_DIR/backend/__pycache__" "$OUTPUT_DIR/backend/venv" 2>/dev/null || true
    
    # Create installation instructions
    cat > "$OUTPUT_DIR/INSTALL.md" << 'INSTALL_EOF'
# Bizzy POS Installation

## PWA Installation (Recommended)
1. Serve the 'frontend' folder on any web server
2. Open in Chrome/Edge browser
3. Click "Install" or look for install icon in address bar
4. App will be installed as a native app

## Mobile Installation
1. Open frontend/android/ in Android Studio
2. Build and deploy to device

## Backend Setup
1. cd backend/
2. python3 -m venv venv
3. source venv/bin/activate
4. pip install -r requirements.txt
5. ./start-production.sh
INSTALL_EOF

    echo -e "${GREEN}✓ Distribution package created in $OUTPUT_DIR${NC}"
}

# Main build process
main() {
    echo "Starting build process..."
    
    check_prerequisites
    build_frontend
    prepare_mobile
    create_package
    
    echo -e "${GREEN}🎉 Build process completed successfully!${NC}"
    echo ""
    echo "📦 Distribution packages ready in: ./dist-packages/"
    echo ""
    echo "🚀 Quick Start:"
    echo "1. Test PWA: cd frontend && npx serve dist -p 3001"
    echo "2. Build Mobile: Open frontend/android/ in Android Studio"
    echo "3. Start Backend: cd backend && ./start-production.sh"
}

# Run main function
main "$@"
EOF
