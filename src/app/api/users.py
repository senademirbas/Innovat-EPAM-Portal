from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.app.db.session import get_db
from src.app.api.deps import get_current_user
from src.app.schemas.user import User, PasswordChange
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
    stats = crud_idea.get_user_stats(db, user_id=current_user.id)
    return stats

@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_my_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change the authenticated user's password securely."""
    # Verify current password
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
    # Reject if new == current
    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must differ from the current password."
        )
    new_hashed = get_password_hash(payload.new_password)
    crud_user.change_password(db, user=current_user, new_hashed_password=new_hashed)
    return {"message": "Password updated successfully."}
