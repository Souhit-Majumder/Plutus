from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class BudgetBase(BaseModel):
    category_id: int
    amount:      Decimal
    month:       str      # Format: "YYYY-MM"


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[Decimal] = None


class BudgetResponse(BudgetBase):
    id:      int
    user_id: int

    class Config:
        from_attributes = True


class BudgetStatus(BaseModel):
    """
    Returned by the 'check budget' endpoint.
    Shows how much was spent vs the budget limit.
    """
    budget_amount: Decimal
    spent_amount:  Decimal
    remaining:     Decimal
    exceeded:      bool       # True if spent > budget
