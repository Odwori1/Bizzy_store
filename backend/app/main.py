from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Make sure this import is here
from app.routers import users, auth, products, inventory, sales, reports, business
from app.services.scheduler import lifespan
from app.routers import two_factor
from app.routers import customers  # ADD THIS IMPORT
from app.routers import refunds  # <-- ADD THIS LINE
from app.routers import suppliers
from app.routers import roles
from app.routers import expense

from app.routers import currency

app = FastAPI(lifespan=lifespan)

# CORS Middleware - UPDATE THIS SECTION
origins = [
    "http://localhost:3000",  # Default port for Create React App
    "http://localhost:5173",  # Default port for Vite
]

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
