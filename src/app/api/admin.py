from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.app.api.deps import RoleChecker, get_current_user
from src.app.db.session import get_db
from src.app.schemas.user import User, UserAdminView, RoleUpdate
from src.app.schemas.idea import IdeaPublic, IdeaEvaluation
from src.app.schemas.todo import Todo, TodoCreate
from src.app.crud import idea as crud_idea
from src.app.crud import user as crud_user
from src.app.crud import notification as crud_notif
from src.app.schemas.notification import NotificationCreate

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


@router.get("/stats", dependencies=[Depends(RoleChecker(["admin"]))])
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


# ── User Management ────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserAdminView], dependencies=[Depends(RoleChecker(["admin"]))])
def list_all_users(db: Session = Depends(get_db)):
    """Return all users with their idea submission statistics."""
    return crud_user.get_all_users_with_stats(db)


@router.patch("/users/{user_id}/role", response_model=UserAdminView)
def update_user_role(
    user_id: str,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """Promote or demote a user's role (admin only)."""
    if payload.role not in ("admin", "submitter"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'submitter'.")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")
    user = crud_user.set_user_role(db, user_id=user_id, role=payload.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    # Build stats response
    stats_list = crud_user.get_all_users_with_stats(db)
    for s in stats_list:
        if s["id"] == user_id:
            return s
    return user


@router.post("/users/{user_id}/todos", response_model=Todo, dependencies=[Depends(RoleChecker(["admin"]))])
def assign_todo_to_user(
    user_id: str,
    data: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """Assign a todo directly to a user's workspace (admin only)."""
    # Ensure user exists
    target = crud_user.get_user(db, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found.")
    
    # Tag the task with the admin's ID
    if getattr(data, 'assigned_by', None) is None:
        data.assigned_by = current_user.id
        
    # We can reuse the todo CRUD here
    from src.app.crud import todo as crud_todo
    return crud_todo.create_todo(db, user_id=user_id, data=data)
