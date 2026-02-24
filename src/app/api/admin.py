from fastapi import APIRouter, Depends
from src.app.api.deps import RoleChecker
from src.app.schemas.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/summary", dependencies=[Depends(RoleChecker(["admin"]))])
def get_admin_summary():
    return {"message": "Admin Dashboard Summary", "total_users": "N/A"}
