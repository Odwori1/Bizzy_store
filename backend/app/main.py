from fastapi import FastAPI
from app.routers import users, auth, products, inventory, sales, reports
from app.services.scheduler import lifespan  # ADDED

app = FastAPI(lifespan=lifespan)  # UPDATED

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(reports.router)

@app.get("/")
def read_root():
    return {"message": "Bizzy POS System - Now with Advanced Analytics"}
