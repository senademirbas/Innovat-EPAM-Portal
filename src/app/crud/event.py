from sqlalchemy.orm import Session
from src.app.models.event import CalendarEvent
from src.app.schemas.event import EventCreate


def get_events_for_user(db: Session, user_id: str) -> list[CalendarEvent]:
    return db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id).order_by(CalendarEvent.date.asc()).all()


def create_event(db: Session, user_id: str, data: EventCreate) -> CalendarEvent:
    event = CalendarEvent(user_id=user_id, title=data.title, date=data.date, color=data.color)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
