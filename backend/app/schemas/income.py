from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class IncomeBase(BaseModel):
    account_id:  int
    amount:      Decimal
    date:        date
    description: Optional[str] = None


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    account_id:  Optional[int]     = None
    amount:      Optional[Decimal] = None
    date:        Optional[date]    = None
    description: Optional[str]    = None


class IncomeResponse(IncomeBase):
    id:      int
    user_id: int

    class Config:
        from_attributes = True
