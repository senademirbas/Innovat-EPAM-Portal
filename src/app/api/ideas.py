from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import uuid

from src.app.api import deps
from src.app.db.session import get_db
from src.app.models.user import User
from src.app.schemas.idea import Idea, IdeaCreate
from src.app.crud import idea as crud_idea

router = APIRouter(prefix="/ideas", tags=["ideas"])

UPLOAD_DIR = "uploads"

@router.post("", response_model=Idea, status_code=status.HTTP_201_CREATED)
def create_idea(
    title: str = Form(..., min_length=3, max_length=100),
    description: str = Form(..., min_length=10, max_length=2000),
    category: str = Form(...),
    attachment: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    file_path = None
    if attachment:
        file_ext = os.path.splitext(attachment.filename)[1]
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(attachment.file, buffer)
    
    idea_in = IdeaCreate(title=title, description=description, category=category)
    return crud_idea.create_idea(db, idea_in, user_id=current_user.id, file_path=file_path)

@router.get("", response_model=List[Idea])
def read_ideas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return crud_idea.get_user_ideas(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/{idea_id}", response_model=Idea)
def read_idea(
    idea_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    idea = crud_idea.get_idea(db, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    if idea.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return idea
