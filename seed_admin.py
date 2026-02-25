"""
seed_admin.py — Creates an admin user in the local SQLite database.
Run with: uv run python seed_admin.py
"""
import uuid
from src.app.db.session import SessionLocal, engine
from src.app.models.user import User
from src.app.models.idea import Idea  # ensures all models are registered with Base
from src.app.db.session import Base
from src.app.core.security import get_password_hash

ADMIN_EMAIL = "admin@epam.com"
ADMIN_PASSWORD = "Admin1234!"

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"[✓] Admin already exists: {existing.email} | role: {existing.role}")
        else:
            admin = User(
                id=str(uuid.uuid4()),
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print(f"[✓] Admin created successfully!")
            print(f"    Email:    {ADMIN_EMAIL}")
            print(f"    Password: {ADMIN_PASSWORD}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
