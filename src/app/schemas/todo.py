from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    tags: Optional[str] = None
    assigned_by: Optional[str] = None
    user_id: Optional[str] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    tags: Optional[str] = None
    done: Optional[bool] = None


class Todo(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    tags: Optional[str] = None
    assigned_by: Optional[str] = None
    done: bool
    created_at: datetime

    model_config = {"from_attributes": True}
