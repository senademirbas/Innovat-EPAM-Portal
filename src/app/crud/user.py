from sqlalchemy.orm import Session
from src.app.models.user import User
from src.app.models.idea import Idea
from src.app.schemas.user import UserCreate, UserProfile
from src.app.core.security import get_password_hash


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        role="submitter"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def change_password(db: Session, user: User, new_hashed_password: str) -> User:
    user.hashed_password = new_hashed_password
    db.commit()
    db.refresh(user)
    return user


def update_profile(db: Session, user: User, data: UserProfile) -> User:
    """Partial update — only overwrites fields that are explicitly provided (non-None)."""
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def get_all_users_with_stats(db: Session) -> list[dict]:
    """Return all users with aggregated idea stats for the admin user table."""
    users = db.query(User).all()
    result = []
    for user in users:
        ideas = db.query(Idea).filter(Idea.user_id == user.id).all()
        total = len(ideas)
        accepted = sum(1 for i in ideas if i.status == "accepted")
        rejected = sum(1 for i in ideas if i.status == "rejected")
        rate = round((accepted / total * 100), 1) if total > 0 else 0.0
        result.append({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "total": total,
            "accepted": accepted,
            "rejected": rejected,
            "success_rate": rate,
        })
    return result


def set_user_role(db: Session, user_id: str, role: str) -> User | None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.role = role
    db.commit()
    db.refresh(user)
    return user
