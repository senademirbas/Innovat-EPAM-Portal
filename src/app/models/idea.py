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

    # Rich content (Phase 2)
    tags = Column(String, nullable=True)               # JSON-encoded list, e.g. '["AI","LLM"]'
    problem_statement = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)

    # Relationships
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    reviewed_by_id = Column(String, ForeignKey("users.id"), nullable=True)

    owner = relationship("User", back_populates="ideas", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])
