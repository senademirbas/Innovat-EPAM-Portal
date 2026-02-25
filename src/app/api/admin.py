from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.app.api.deps import RoleChecker, get_current_user
from src.app.db.session import get_db
from src.app.schemas.user import User
from src.app.schemas.idea import IdeaPublic, IdeaEvaluation
from src.app.schemas.stats import AdminStats
from src.app.crud import idea as crud_idea

router = APIRouter(prefix="/admin", tags=["admin"])

def _idea_to_public(idea) -> IdeaPublic:
    return IdeaPublic.model_validate({
        **{c.name: getattr(idea, c.name) for c in idea.__table__.columns},
        "author": idea.owner,
        "reviewer": idea.reviewer,
    })

@router.get("/summary", dependencies=[Depends(RoleChecker(["admin"]))])
def get_admin_summary():
    return {"message": "Admin Dashboard Summary", "total_users": "N/A"}

@router.get("/ideas", response_model=List[IdeaPublic], dependencies=[Depends(RoleChecker(["admin"]))])
def read_all_ideas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    ideas = crud_idea.get_all_ideas(db, skip=skip, limit=limit)
    return [_idea_to_public(i) for i in ideas]

@router.get("/stats", response_model=AdminStats, dependencies=[Depends(RoleChecker(["admin"]))])
def get_admin_stats(db: Session = Depends(get_db)):
    return crud_idea.get_admin_stats(db)

@router.patch("/ideas/{idea_id}/evaluate", response_model=IdeaPublic)
def evaluate_idea(
    idea_id: str,
    evaluation: IdeaEvaluation,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    idea = crud_idea.get_idea(db, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    updated = crud_idea.evaluate_idea(
        db,
        idea_id=idea_id,
        status=evaluation.status,
        comment=evaluation.admin_comment,
        reviewed_by_id=current_user.id
    )
    return _idea_to_public(updated)
