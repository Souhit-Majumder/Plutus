from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class LoanBase(BaseModel):
    person_id:   int
    loan_type:   str   # "lent" or "borrowed"
    amount:      Decimal
    loan_date:   Optional[date] = None
    due_date:    Optional[date] = None
    description: Optional[str] = None


class LoanCreate(LoanBase):
    pass


class LoanUpdate(BaseModel):
    due_date:    Optional[date]    = None
    description: Optional[str]    = None
    amount:      Optional[Decimal] = None


class LoanResponse(LoanBase):
    id:          int
    user_id:     int
    status:      str
    repaid_date: Optional[date] = None

    class Config:
        from_attributes = True
