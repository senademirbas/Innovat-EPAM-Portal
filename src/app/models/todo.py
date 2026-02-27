import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from src.app.db.session import Base


def _uuid():
    return str(uuid.uuid4())


class Todo(Base):
    __tablename__ = "todos"

    id = Column(String, primary_key=True, index=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    date = Column(String, nullable=True) # "YYYY-MM-DD" mapped to calendar
    start_time = Column(String, nullable=True) # "HH:MM"
    end_time = Column(String, nullable=True) # "HH:MM"
    tags = Column(String, nullable=True) # comma separated
    assigned_by = Column(String, ForeignKey("users.id"), nullable=True) # Admin ID who assigned
    done = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
