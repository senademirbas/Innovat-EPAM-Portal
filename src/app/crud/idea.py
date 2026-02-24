from sqlalchemy.orm import Session
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
    return db_idea

def get_user_ideas(db: Session, user_id: str, skip: int = 0, limit: int = 100):
    return db.query(Idea).filter(Idea.user_id == user_id).offset(skip).limit(limit).all()

def get_idea(db: Session, idea_id: str):
    return db.query(Idea).filter(Idea.id == idea_id).first()

def evaluate_idea(db: Session, idea_id: str, status: str, comment: str = None):
    db_idea = get_idea(db, idea_id)
    if db_idea:
        db_idea.status = status
        db_idea.admin_comment = comment
        db.commit()
        db.refresh(db_idea)
    return db_idea
