from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import uuid

from src.app.api import deps
from src.app.db.session import get_db
from src.app.models.user import User
from src.app.schemas.idea import IdeaPublic, IdeaCreate
from src.app.crud import idea as crud_idea

router = APIRouter(prefix="/ideas", tags=["ideas"])

UPLOAD_DIR = "uploads"

def _to_public(idea) -> dict:
    """Map Idea ORM object → IdeaPublic-compatible dict with author/reviewer."""
    d = {c.name: getattr(idea, c.name) for c in idea.__table__.columns}
    d["author"] = idea.owner
    d["reviewer"] = idea.reviewer
    return d

@router.post("", response_model=IdeaPublic, status_code=status.HTTP_201_CREATED)
def create_idea(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    tags: Optional[str] = Form(None),
    problem_statement: Optional[str] = Form(None),
    solution: Optional[str] = Form(None),
    attachment: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    file_path = None
    if attachment and attachment.filename:
        file_ext = os.path.splitext(attachment.filename)[1]
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(attachment.file, buffer)

    idea_in = IdeaCreate(
        title=title, description=description, category=category,
        tags=tags, problem_statement=problem_statement, solution=solution
    )
    db_idea = crud_idea.create_idea(db, idea_in, user_id=current_user.id, file_path=file_path)
    return IdeaPublic.model_validate({**{c.name: getattr(db_idea, c.name) for c in db_idea.__table__.columns}, "author": db_idea.owner, "reviewer": db_idea.reviewer})

@router.get("", response_model=List[IdeaPublic])
def read_ideas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    ideas = crud_idea.get_user_ideas(db, user_id=current_user.id, skip=skip, limit=limit)
    return [IdeaPublic.model_validate({**{c.name: getattr(i, c.name) for c in i.__table__.columns}, "author": i.owner, "reviewer": i.reviewer}) for i in ideas]

@router.get("/{idea_id}", response_model=IdeaPublic)
def read_idea(
    idea_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    idea = crud_idea.get_idea(db, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    if idea.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return IdeaPublic.model_validate({**{c.name: getattr(idea, c.name) for c in idea.__table__.columns}, "author": idea.owner, "reviewer": idea.reviewer})
