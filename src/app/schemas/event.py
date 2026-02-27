from typing import Optional
from pydantic import BaseModel


class EventCreate(BaseModel):
    title: str
    date: str          # "YYYY-MM-DD"
    time: Optional[str] = None
    description: Optional[str] = None
    color: str = "#06b6d4"


class Event(BaseModel):
    id: str
    user_id: str
    title: str
    date: str
    time: Optional[str] = None
    description: Optional[str] = None
    color: str

    model_config = {"from_attributes": True}
