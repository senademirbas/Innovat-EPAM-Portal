from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class IdeaBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str

class IdeaCreate(IdeaBase):
    pass

class IdeaEvaluation(BaseModel):
    status: str
    admin_comment: Optional[str] = None

class Idea(IdeaBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    file_path: Optional[str] = None
    status: str
    admin_comment: Optional[str] = None
    created_at: datetime
