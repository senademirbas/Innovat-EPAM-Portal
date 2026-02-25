from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.app.db.session import get_db
from src.app.api.deps import get_current_user
from src.app.schemas.user import User, PasswordChange, UserProfile, PublicProfile
from src.app.schemas.stats import UserStats
from src.app.crud import idea as crud_idea
from src.app.crud import user as crud_user
from src.app.core.security import verify_password, get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me/stats", response_model=UserStats)
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return the authenticated user's idea submission statistics."""
    return crud_idea.get_user_stats(db, user_id=current_user.id)

@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_my_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change the authenticated user's password securely."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must differ from the current password.")
    crud_user.change_password(db, user=current_user, new_hashed_password=get_password_hash(payload.new_password))
    return {"message": "Password updated successfully."}

@router.put("/me/profile", response_model=User)
def update_my_profile(
    data: UserProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the authenticated user's social profile fields."""
    updated = crud_user.update_profile(db, user=current_user, data=data)
    return updated

@router.get("/{user_id}/profile", response_model=PublicProfile)
def get_public_profile(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Public profile lookup — no authentication required."""
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
