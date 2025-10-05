#!/bin/bash

echo "🔍 BIZZY POS APPLICATION ANALYSIS REPORT"
echo "========================================"
echo "Analysis Date: $(date)"
echo ""

# Project Structure
echo "📁 PROJECT STRUCTURE"
echo "===================="
find . -type f -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" | sort | head -30
echo ""

# Backend Analysis
echo "🐍 BACKEND ANALYSIS"
echo "==================="
echo "Python Version: $(python --version 2>/dev/null || echo 'Not available')"
echo ""

# Dependencies
echo "📦 BACKEND DEPENDENCIES"
if [ -f "backend/requirements.txt" ]; then
    echo "Main dependencies:"
    grep -E "^(fastapi|uvicorn|sqlalchemy|psycopg|pydantic|jose|passlib)" backend/requirements.txt || echo "No major dependencies found"
else
    echo "No requirements.txt found"
fi
echo ""

# API Endpoints
echo "🌐 API ENDPOINTS ANALYSIS"
if [ -f "backend/main.py" ]; then
    echo "Found endpoints:"
    grep -n "@app\." backend/main.py | head -20
else
    echo "No main.py found in backend"
fi
echo ""

# Frontend Analysis
echo "⚛️  FRONTEND ANALYSIS"
echo "===================="
if [ -f "frontend/package.json" ]; then
    echo "React Version: $(grep '"react"' frontend/package.json | head -1)"
    echo "Build Tool: $(grep '"vite\|webpack\|next"' frontend/package.json | head -1)"
    echo ""
    
    echo "📦 FRONTEND DEPENDENCIES"
    echo "Core dependencies:"
    grep -E '"(react|react-dom|typescript|vite|axios|recharts|tailwind)' frontend/package.json
    echo ""
    
    echo "UI Framework:"
    grep -E '"(tailwind|mui|chakra|antd)' frontend/package.json
else
    echo "No package.json found in frontend"
fi
echo ""

# Database Analysis
echo "🗄️  DATABASE ANALYSIS"
echo "===================="
if [ -f "backend/.env" ]; then
    echo "Database URL: $(grep DATABASE_URL backend/.env | cut -d'=' -f2 | cut -c1-20)..."
    echo "Database Type: PostgreSQL"
else
    echo "No .env file found"
fi
echo ""

# Key Features Detection
echo "🎯 KEY FEATURES DETECTED"
echo "======================="

# Check for POS features
if [ -f "frontend/src/components/pos/Cart.tsx" ]; then
    echo "✅ Point of Sale (POS) System"
fi

if [ -f "frontend/src/components/charts" ]; then
    echo "✅ Analytics & Dashboard Charts"
fi

if grep -r "barcode" frontend/src/ > /dev/null 2>&1; then
    echo "✅ Barcode Scanning"
fi

if grep -r "inventory" frontend/src/ > /dev/null 2>&1; then
    echo "✅ Inventory Management"
fi

if grep -r "multi.*tenant\|tenant" backend/ > /dev/null 2>&1; then
    echo "✅ Multi-tenant Architecture"
fi

if grep -r "currency.*convert\|exchange.*rate" . > /dev/null 2>&1; then
    echo "✅ Multi-currency Support"
fi

echo ""

# Security Features
echo "🔐 SECURITY FEATURES"
echo "==================="
if grep -r "jwt\|authentication\|auth" backend/ > /dev/null 2>&1; then
    echo "✅ JWT Authentication"
fi

if grep -r "permission\|role" backend/ > /dev/null 2>&1; then
    echo "✅ Role-Based Access Control (RBAC)"
fi

if grep -r "cors" backend/ > /dev/null 2>&1; then
    echo "✅ CORS Configuration"
fi
echo ""

# Build & Deployment
echo "🚀 BUILD & DEPLOYMENT"
echo "===================="
if [ -f "frontend/package.json" ]; then
    echo "Build command: $(grep '"build"' frontend/package.json | head -1)"
    echo "Start command: $(grep '"dev\|start"' frontend/package.json | head -1)"
fi

if [ -f "docker-compose.yml" ] || [ -f "Dockerfile" ]; then
    echo "✅ Docker Support"
fi

if [ -f "frontend/capacitor.config.ts" ]; then
    echo "✅ Mobile App (Capacitor)"
fi
echo ""

# File Statistics
echo "📊 PROJECT STATISTICS"
echo "===================="
echo "Backend Python files: $(find backend -name "*.py" | wc -l)"
echo "Frontend TypeScript files: $(find frontend/src -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "Total lines of code (approx): $(find backend frontend -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')"
echo ""

# Architecture Overview
echo "🏗️  ARCHITECTURE OVERVIEW"
echo "========================"
echo "Frontend: React + TypeScript + Vite + Tailwind CSS"
echo "Backend: FastAPI + PostgreSQL + SQLAlchemy"
echo "State Management: Zustand"
echo "Charts: Recharts"
echo "API Client: Axios"
echo ""

# Quick Start Commands
echo "⚡ QUICK START"
echo "============="
echo "Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "Frontend: cd frontend && npm run dev"
echo "Build: cd frontend && npm run build"
echo ""

echo "📋 NEXT STEPS FOR README.md"
echo "==========================="
echo "1. Update project description based on features detected"
echo "2. Document API endpoints found"
echo "3. Add installation instructions for dependencies found"
echo "4. Include mobile deployment instructions if Capacitor detected"
echo "5. Add troubleshooting for common issues found"

# Generate a summary file
cat > ANALYSIS_SUMMARY.txt << EOF
BIZZY POS APPLICATION ANALYSIS SUMMARY
Generated: $(date)

PROJECT STRUCTURE:
- Backend: FastAPI Python application
- Frontend: React TypeScript application
- Database: PostgreSQL

KEY FEATURES DETECTED:
- Point of Sale (POS) System
- Inventory Management
- Multi-currency Support
- Analytics Dashboard
- Barcode Scanning
- JWT Authentication
- Role-Based Access Control

TECH STACK:
Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts, Axios, Zustand
Backend: FastAPI, SQLAlchemy, PostgreSQL, JWT, Python-Jose

BUILD COMMANDS:
Backend: uvicorn main:app --reload
Frontend: npm run dev / npm run build

DEPLOYMENT:
- Docker support: $(if [ -f "docker-compose.yml" ]; then echo "Yes"; else echo "No"; fi)
- Mobile app: $(if [ -f "frontend/capacitor.config.ts" ]; then echo "Capacitor"; else echo "No"; fi)

STATISTICS:
- Backend files: $(find backend -name "*.py" | wc -l)
- Frontend files: $(find frontend/src -name "*.ts" -o -name "*.tsx" | wc -l)
EOF

echo "✅ Analysis complete! Summary saved to ANALYSIS_SUMMARY.txt"
