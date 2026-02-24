import uuid
from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from src.app.db.session import Base

class User(Base):
    __tablename__ = "users"

    # Use String as fallback for SQLite if needed, but keeping UUID for plan mapping
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="submitter") # submitter or admin
    is_active = Column(Boolean, default=True)
