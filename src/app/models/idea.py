from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from src.app.db.session import Base

class Idea(Base):
    __tablename__ = "ideas"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    file_path = Column(String, nullable=True)
    status = Column(String, default="submitted")
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    owner = relationship("User", back_populates="ideas")
