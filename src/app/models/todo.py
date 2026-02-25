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
    text = Column(String, nullable=False)
    done = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
