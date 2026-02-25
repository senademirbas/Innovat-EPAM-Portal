from pydantic import BaseModel


class EventCreate(BaseModel):
    title: str
    date: str          # "YYYY-MM-DD"
    color: str = "#06b6d4"


class Event(BaseModel):
    id: str
    user_id: str
    title: str
    date: str
    color: str

    model_config = {"from_attributes": True}
