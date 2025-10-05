# Bizzy POS - Enterprise Multi-Tenant Point of Sale System

![Bizzy POS](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116.1-green.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13-336791.svg)

A comprehensive, production-ready Point of Sale system designed for multi-business operations with advanced inventory management, real-time analytics, and multi-currency support.

## 🎯 Key Features

### 💰 Point of Sale
- **Complete POS Interface** with cart management and payment processing
- **Real-time Receipt Generation** with customizable templates
- **Barcode Scanning Integration** for quick product lookup
- **Multi-payment Support** (cash, card, mobile money)

### 📊 Business Intelligence
- **Real-time Dashboard** with sales trends and KPIs
- **Advanced Analytics** with Recharts visualization
- **Sales Reporting** with export capabilities (JSON, CSV, Excel)
- **Inventory Analytics** with stock movement tracking

### 🏢 Multi-Tenant Architecture
- **Isolated Business Environments** with separate data
- **Role-Based Access Control** (RBAC) with granular permissions
- **Business-specific Configuration** (currency, tax, branding)

### 🌍 Multi-Currency Support
- **Automatic Exchange Rates** from OpenExchangeRates API
- **Local Currency Pricing** with historical rate tracking
- **Dual Currency Display** throughout the application

### 📱 Mobile Optimized
- **Progressive Web App** (PWA) capabilities
- **Responsive Design** for tablets and mobile devices
- **Capacitor Integration** for native mobile app deployment

## 🏗️ System Architecture

### Frontend Stack
- **Framework**: React 18.2.0 + TypeScript 5.0.2
- **Build Tool**: Vite 4.4.5 with hot reload
- **Styling**: Tailwind CSS 3.3.0 with custom components
- **State Management**: Zustand for lightweight state
- **Charts**: Recharts 2.1.2 for data visualization
- **HTTP Client**: Axios 1.5.0 with interceptors

### Backend Stack
- **Framework**: FastAPI 0.116.1 with automatic OpenAPI docs
- **Database**: PostgreSQL 13 with SQLAlchemy ORM
- **Authentication**: JWT with Passlib hashing
- **Migrations**: Alembic for database versioning
- **Validation**: Pydantic 2.11.7 for data models

### Security Features
- **JWT Token Authentication** with configurable expiration
- **Role-Based Access Control** with permission system
- **CORS Configuration** for cross-origin requests
- **Input Validation** with Pydantic models
- **SQL Injection Protection** via SQLAlchemy

## 📦 Installation Guide

### Prerequisites
- Python 3.10+
- Node.js 16+
- PostgreSQL 13+
- npm or yarn

### Backend Setup

```bash
# Clone the repository
git clone <repository-url>
cd Bizzy_store/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials:
# DATABASE_URL=postgresql://pos_user:password@localhost/bizzy_pos_db
# SECRET_KEY=your-secret-key-here

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
