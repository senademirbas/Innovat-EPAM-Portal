from pydantic import BaseModel
from typing import List

class UserStats(BaseModel):
    total: int
    accepted: int
    rejected: int
    pending: int
    success_rate: float  # (accepted / total) * 100, 0.0 if total == 0

class DailyCount(BaseModel):
    date: str  # "YYYY-MM-DD"
    count: int

class AdminStats(BaseModel):
    total: int
    accepted: int
    rejected: int
    pending: int
    acceptance_rate: float
    daily_submissions: List[DailyCount]
