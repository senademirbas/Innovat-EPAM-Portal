from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TodoCreate(BaseModel):
    text: str


class TodoUpdate(BaseModel):
    text: Optional[str] = None
    done: Optional[bool] = None


class Todo(BaseModel):
    id: str
    user_id: str
    text: str
    done: bool
    created_at: datetime

    model_config = {"from_attributes": True}
