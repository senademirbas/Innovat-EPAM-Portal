from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from src.app.models.idea import Idea
from src.app.schemas.idea import IdeaCreate

def create_idea(db: Session, idea: IdeaCreate, user_id: str, file_path: str = None):
    db_idea = Idea(
        **idea.model_dump(),
        user_id=user_id,
        file_path=file_path
    )
    db.add(db_idea)
    db.commit()
    db.refresh(db_idea)
    # Reload with relationships
    return db.query(Idea).options(joinedload(Idea.owner), joinedload(Idea.reviewer)).filter(Idea.id == db_idea.id).first()

def get_user_ideas(db: Session, user_id: str, skip: int = 0, limit: int = 100):
    return (
        db.query(Idea)
        .options(joinedload(Idea.owner), joinedload(Idea.reviewer))
        .filter(Idea.user_id == user_id)
        .offset(skip).limit(limit).all()
    )

def get_idea(db: Session, idea_id: str):
    return (
        db.query(Idea)
        .options(joinedload(Idea.owner), joinedload(Idea.reviewer))
        .filter(Idea.id == idea_id)
        .first()
    )

def get_all_ideas(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Idea)
        .options(joinedload(Idea.owner), joinedload(Idea.reviewer))
        .offset(skip).limit(limit).all()
    )

def evaluate_idea(db: Session, idea_id: str, status: str, comment: str = None, reviewed_by_id: str = None):
    db_idea = get_idea(db, idea_id)
    if db_idea:
        db_idea.status = status
        db_idea.admin_comment = comment
        if reviewed_by_id:
            db_idea.reviewed_by_id = reviewed_by_id
        db.commit()
        db.refresh(db_idea)
        # Reload with relationships for reviewer identity
        return get_idea(db, idea_id)
    return db_idea

def get_user_stats(db: Session, user_id: str) -> dict:
    ideas = db.query(Idea).filter(Idea.user_id == user_id).all()
    total = len(ideas)
    accepted = sum(1 for i in ideas if i.status == "accepted")
    rejected = sum(1 for i in ideas if i.status == "rejected")
    pending = total - accepted - rejected
    success_rate = round(float(accepted / total) * 100, 1) if total else 0.0
    return {"total": total, "accepted": accepted, "rejected": rejected, "pending": pending, "success_rate": success_rate}

def get_admin_stats(db: Session) -> dict:
    ideas = db.query(Idea).all()
    total = len(ideas)
    accepted = sum(1 for i in ideas if i.status == "accepted")
    rejected = sum(1 for i in ideas if i.status == "rejected")
    pending = total - accepted - rejected
    acceptance_rate = round(float(accepted / total) * 100, 1) if total else 0.0

    daily_rows = (
        db.query(
            func.strftime('%Y-%m-%d', Idea.created_at).label('date'),
            func.count(Idea.id).label('count')
        )
        .group_by(func.strftime('%Y-%m-%d', Idea.created_at))
        .order_by(func.strftime('%Y-%m-%d', Idea.created_at))
        .all()
    )
    daily_submissions = [{"date": row.date, "count": row.count} for row in daily_rows]

    return {
        "total": total,
        "accepted": accepted,
        "rejected": rejected,
        "pending": pending,
        "acceptance_rate": acceptance_rate,
        "daily_submissions": daily_submissions,
    }
