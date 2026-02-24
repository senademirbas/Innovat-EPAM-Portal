from fastapi import FastAPI
from src.app.api import auth, admin
from src.app.api import auth, admin, ideas
from src.app.db.session import engine, Base

# Create tables for dev
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Innovat-EPAM-Portal API",
    description="User Authentication and Project Portal API",
    version="0.1.0"
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(ideas.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Innovat-EPAM-Portal API"}
