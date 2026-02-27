from sqlalchemy.orm import Session
from src.app.models.notification import Notification
from src.app.schemas.notification import NotificationCreate

def create_notification(db: Session, notif: NotificationCreate):
    db_notif = Notification(**notif.model_dump())
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

def get_user_notifications(db: Session, user_id: str, limit: int = 20):
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(limit).all()

def get_unread_count(db: Session, user_id: str):
    return db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).count()

def mark_all_as_read(db: Session, user_id: str):
    db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return True
