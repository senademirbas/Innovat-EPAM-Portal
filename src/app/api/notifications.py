from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from src.app.api import deps
from src.app.db.session import get_db
from src.app.models.user import User
from src.app.schemas.notification import Notification
from src.app.crud import notification as crud_notif

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[Notification])
def get_my_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get notifications for the current user."""
    return crud_notif.get_user_notifications(db, user_id=current_user.id, limit=limit)

@router.patch("/read", status_code=status.HTTP_200_OK)
def mark_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Mark all notifications as read for current user."""
    crud_notif.mark_all_as_read(db, user_id=current_user.id)
    return {"message": "All notifications marked as read."}
