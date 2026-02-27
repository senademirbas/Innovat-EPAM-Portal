from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class NotificationCreate(BaseModel):
    user_id: str
    message: str
    type: str

class NotificationUpdate(BaseModel):
    is_read: bool

class Notification(BaseModel):
    id: str
    user_id: str
    message: str
    is_read: bool
    type: str
    created_at: datetime

    model_config = {"from_attributes": True}
