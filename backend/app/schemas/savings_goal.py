from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class SavingsGoalBase(BaseModel):
    goal_name:     str
    target_amount: Decimal
    category_id:   Optional[int]  = None
    deadline:      Optional[date] = None


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    goal_name:     Optional[str]     = None
    target_amount: Optional[Decimal] = None
    deadline:      Optional[date]    = None


class AddFundsRequest(BaseModel):
    """Body for the 'add funds to goal' endpoint."""
    amount: Decimal


class SavingsGoalResponse(SavingsGoalBase):
    id:               int
    user_id:          int
    saved_amount:     Decimal
    remaining_amount: Decimal   # computed field

    class Config:
        from_attributes = True
