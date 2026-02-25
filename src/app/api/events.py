from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.app.db.session import get_db
from src.app.api.deps import get_current_user
from src.app.schemas.event import Event, EventCreate
from src.app.crud import event as crud_event

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[Event])
def list_events(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all calendar events for the authenticated user."""
    return crud_event.get_events_for_user(db, user_id=current_user.id)


@router.post("", response_model=Event, status_code=status.HTTP_201_CREATED)
def create_event(
    data: EventCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new calendar event."""
    return crud_event.create_event(db, user_id=current_user.id, data=data)
