from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from src.app.schemas.user import PublicProfile

class IdeaBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str

class IdeaCreate(IdeaBase):
    tags: Optional[str] = None               # comma-separated, e.g. "AI, LLM, Cloud"
    problem_statement: Optional[str] = None
    solution: Optional[str] = None

class IdeaEvaluation(BaseModel):
    status: str
    admin_comment: Optional[str] = None

class Idea(IdeaBase):
    """Internal/backward-compatible schema. Still used by existing tests."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    file_path: Optional[str] = None
    status: str
    admin_comment: Optional[str] = None
    created_at: datetime
    tags: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None

class IdeaPublic(IdeaBase):
    """Extended schema with nested author + reviewer identity for the social feed."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    file_path: Optional[str] = None
    status: str
    admin_comment: Optional[str] = None
    created_at: datetime
    tags: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    author: Optional[PublicProfile] = None
    reviewer: Optional[PublicProfile] = None
