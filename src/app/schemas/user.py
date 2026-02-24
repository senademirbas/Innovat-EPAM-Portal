from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    role: str
    is_active: bool
