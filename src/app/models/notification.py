import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from src.app.db.session import Base

def _uuid():
    return str(uuid.uuid4())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    type = Column(String, nullable=False) # e.g. "idea_review", "task_assigned", "new_idea"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
