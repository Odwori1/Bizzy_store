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
