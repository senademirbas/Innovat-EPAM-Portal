from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.app.api.deps import RoleChecker, get_current_user
from src.app.db.session import get_db
from src.app.schemas.user import User
from src.app.schemas.idea import Idea, IdeaEvaluation
from src.app.crud import idea as crud_idea

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/summary", dependencies=[Depends(RoleChecker(["admin"]))])
def get_admin_summary():
    return {"message": "Admin Dashboard Summary", "total_users": "N/A"}

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
