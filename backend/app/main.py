from fastapi import FastAPI
from app.routers import users, auth, products, inventory  

app = FastAPI()

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(products.router)  # Add this line
app.include_router(inventory.router)

@app.get("/")
def read_root():
    return {"message": "Bizzy POS System"}
