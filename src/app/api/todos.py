from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.app.db.session import get_db
from src.app.api.deps import get_current_user
from src.app.schemas.todo import Todo, TodoCreate, TodoUpdate
from src.app.crud import todo as crud_todo
from src.app.crud import notification as crud_notif
from src.app.schemas.notification import NotificationCreate

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=list[Todo])
def list_todos(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all todos for the authenticated user."""
    return crud_todo.get_todos(db, user_id=current_user.id)


@router.post("", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_todo(
    data: TodoCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new todo item. Admin can assign to others."""
    target_user_id = current_user.id
    if current_user.role == "admin" and data.user_id:
        target_user_id = data.user_id
        data.assigned_by = current_user.id
        
    todo = crud_todo.create_todo(db, user_id=target_user_id, data=data)
    
    # Notify target user if assigned by admin
    if target_user_id != current_user.id:
        crud_notif.create_notification(db, NotificationCreate(
            user_id=target_user_id,
            message=f"You've been assigned a new task: '{todo.title}' by {current_user.email}.",
            type="task_assigned"
        ))
        
    return todo


@router.patch("/{todo_id}", response_model=Todo)
def update_todo(
    todo_id: str,
    data: TodoUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update text or toggle done state for a todo."""
    todo = crud_todo.update_todo(db, todo_id=todo_id, user_id=current_user.id, data=data)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found or not yours.")
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a todo item."""
    deleted = crud_todo.delete_todo(db, todo_id=todo_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Todo not found or not yours.")
