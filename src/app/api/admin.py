from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.app.api.deps import RoleChecker, get_current_user
from src.app.db.session import get_db
from src.app.schemas.user import User
from src.app.schemas.idea import Idea, IdeaEvaluation
from src.app.schemas.stats import AdminStats
from src.app.crud import idea as crud_idea

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/summary", dependencies=[Depends(RoleChecker(["admin"]))])
def get_admin_summary():
    return {"message": "Admin Dashboard Summary", "total_users": "N/A"}

@router.get("/ideas", response_model=List[Idea], dependencies=[Depends(RoleChecker(["admin"]))])
def read_all_ideas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud_idea.get_all_ideas(db, skip=skip, limit=limit)

@router.get("/stats", response_model=AdminStats, dependencies=[Depends(RoleChecker(["admin"]))])
def get_admin_stats(db: Session = Depends(get_db)):
    """Return system-wide stats and daily submission counts for the last 30 days."""
    return crud_idea.get_admin_stats(db)

@router.patch("/ideas/{idea_id}/evaluate", response_model=Idea, dependencies=[Depends(RoleChecker(["admin"]))])
def evaluate_idea(
    idea_id: str,
    evaluation: IdeaEvaluation,
    db: Session = Depends(get_db)
):
    idea = crud_idea.get_idea(db, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    updated_idea = crud_idea.evaluate_idea(
        db, 
        idea_id=idea_id, 
        status=evaluation.status, 
        comment=evaluation.admin_comment
    )
    return updated_idea

