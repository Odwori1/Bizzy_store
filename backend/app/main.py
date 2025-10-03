from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Make sure this import is here
from app.routers import users, auth, products, inventory, sales, reports, business, scanner, analytics
from app.services.scheduler import lifespan
from app.routers import two_factor
from app.routers import customers  # ADD THIS IMPORT
from app.routers import refunds  # <-- ADD THIS LINE
from app.routers import suppliers
from app.routers import roles
from app.routers import expense
from app.routers import activity  # Add this line
#from app.routers import test_auth  # Temporary for debugging

from app.routers import currency

app = FastAPI(lifespan=lifespan)

# OLD CORS Middleware - COMMENTED OUT FOR DEPLOYMENT
# origins = [
#     "http://localhost:3000",  # Default port for Create React App
#     "http://localhost:5173",  # Default port for Vite
#     "http://127.0.0.1:3000",  # Add this line
#     "http://127.0.0.1:5173",   # Add this line
# ]

# NEW CORS Middleware - Dynamic configuration for production
import os

# Get allowed origins from environment variable or use defaults
origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://bizzy-pos.netlify.app")
origins = [origin.strip() for origin in origins_raw.split(",")]

print(f"CORS Allowed Origins: {origins}")  # Debug logging

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # This allows all methods, including OPTIONS
    allow_headers=["*"],  # This allows all headers
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(reports.router)
app.include_router(business.router)  # ADD THIS LINE
app.include_router(two_factor.router)  # ADD THIS LINE
app.include_router(customers.router)  # ADD THIS LINE
app.include_router(refunds.router)
app.include_router(suppliers.router)
app.include_router(roles.router)
app.include_router(currency.router)
app.include_router(expense.router)
app.include_router(scanner.router)
app.include_router(analytics.router)
app.include_router(activity.router)  # Add this line
#app.include_router(test_auth.router)  # Temporary for debugging

# Add this function to print all routes on startup
@app.on_event("startup")
async def startup_event():
    print("Registered routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            print(f"{list(route.methods)} {route.path}")

@app.get("/")
def read_root():
    return {"message": "Bizzy POS System - Now with Advanced Analytics"}

# Add a debug endpoint
@app.get("/api/debug/report")
def debug_report():
    import inspect
    from app.crud import report
    # Get the source code of the function
    source = inspect.getsource(report.get_financial_report)
    return {"source": source}
