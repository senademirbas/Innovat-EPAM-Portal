from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from src.app.api import auth, admin, ideas, users
from src.app.db.session import engine, Base
import os

# Create tables for dev
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Innovat-EPAM-Portal API",
    description="User Authentication and Project Portal API",
    version="0.1.0"
)

app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(ideas.router, prefix="/api")
app.include_router(users.router, prefix="/api")


# Mount upload directory
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")
