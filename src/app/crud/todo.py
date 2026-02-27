from sqlalchemy.orm import Session
from src.app.models.todo import Todo
from src.app.schemas.todo import TodoCreate, TodoUpdate


def get_todos(db: Session, user_id: str) -> list[Todo]:
    return db.query(Todo).filter(Todo.user_id == user_id).order_by(Todo.created_at.asc()).all()


def create_todo(db: Session, user_id: str, data: TodoCreate) -> Todo:
    todo = Todo(
        user_id=user_id,
        title=data.title,
        description=data.description,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        tags=data.tags,
        assigned_by=data.assigned_by
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def update_todo(db: Session, todo_id: str, user_id: str, data: TodoUpdate) -> Todo | None:
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not todo:
        return None
    if data.title is not None:
        todo.title = data.title
    if data.description is not None:
        todo.description = data.description
    if data.date is not None:
        todo.date = data.date
    if data.start_time is not None:
        todo.start_time = data.start_time
    if data.end_time is not None:
        todo.end_time = data.end_time
    if data.tags is not None:
        todo.tags = data.tags
    if data.done is not None:
        todo.done = data.done
    db.commit()
    db.refresh(todo)
    return todo


def delete_todo(db: Session, todo_id: str, user_id: str) -> bool:
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not todo:
        return False
    db.delete(todo)
    db.commit()
    return True
