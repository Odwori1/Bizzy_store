from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, auth, products, inventory, sales, reports, business, scanner, analytics
from app.services.scheduler import lifespan
from app.routers import two_factor
from app.routers import customers
from app.routers import refunds
from app.routers import suppliers
from app.routers import roles
from app.routers import expense
from app.routers import activity
from app.routers import currency
import os

app = FastAPI(lifespan=lifespan)

# CORS Middleware - Environment-based configuration
# Default to localhost for development
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",  # ← YOUR FRONTEND PORT
    "http://localhost:5173", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",  # ← YOUR FRONTEND PORT
    "http://localhost:8000",   # ← BACKEND PORT
    "http://127.0.0.1:8000",   # ← BACKEND PORT
]
# Add production origins from environment variable
production_origins = os.getenv("ALLOWED_ORIGINS", "")
if production_origins:
    allowed_origins.extend([origin.strip() for origin in production_origins.split(",")])

# Add common production domains
common_production_origins = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "capacitor://localhost",
    "http://localhost"
]

# Add common production origins that don't require configuration
allowed_origins.extend(common_production_origins)

print(f"🔧 CORS Allowed Origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(reports.router)
app.include_router(business.router)
app.include_router(two_factor.router)
app.include_router(customers.router)
app.include_router(refunds.router)
app.include_router(suppliers.router)
app.include_router(roles.router)
app.include_router(currency.router)
app.include_router(expense.router)
app.include_router(scanner.router)
app.include_router(analytics.router)
app.include_router(activity.router)

# Add this function to print all routes on startup
@app.on_event("startup")
async def startup_event():
    print("🔍 Registered routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            print(f"   {list(route.methods)} {route.path}")

@app.get("/")
def read_root():
    return {"message": "Bizzy POS System - Production Ready"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Bizzy POS API"}

# Add a debug endpoint
@app.get("/api/debug/report")
def debug_report():
    import inspect
    from app.crud import report
    # Get the source code of the function
    source = inspect.getsource(report.get_financial_report)
    return {"source": source}
