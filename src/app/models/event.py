import uuid
from sqlalchemy import Column, String, ForeignKey
from src.app.db.session import Base


def _uuid():
    return str(uuid.uuid4())


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True, index=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False)   # "YYYY-MM-DD"
    time = Column(String, nullable=True)    # "HH:MM"
    description = Column(String, nullable=True)
    color = Column(String, default="#06b6d4")
