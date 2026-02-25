from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class PublicProfile(BaseModel):
    """Read-only public-facing user identity — embedded in idea/review responses."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_link: Optional[str] = None
    linkedin_link: Optional[str] = None
    studio_name: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_link: Optional[str] = None
    linkedin_link: Optional[str] = None
    studio_name: Optional[str] = None

class UserProfile(BaseModel):
    """Writable profile fields."""
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_link: Optional[str] = None
    linkedin_link: Optional[str] = None
    studio_name: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class UserAdminView(BaseModel):
    """Admin view: user stats for the user management table."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    role: str
    is_active: bool
    total: int = 0
    accepted: int = 0
    rejected: int = 0
    success_rate: float = 0.0

class RoleUpdate(BaseModel):
    role: str  # "admin" or "submitter"
