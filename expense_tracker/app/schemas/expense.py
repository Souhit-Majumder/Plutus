from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.tag import TagResponse


class ExpenseBase(BaseModel):
    account_id:        int
    category_id:       int
    payment_method_id: Optional[int] = None
    amount:            Decimal
    date:              date
    description:       Optional[str] = None


class ExpenseCreate(ExpenseBase):
    # Client can optionally attach tag IDs when creating an expense
    tag_ids: Optional[List[int]] = []


class ExpenseUpdate(BaseModel):
    account_id:        Optional[int]     = None
    category_id:       Optional[int]     = None
    payment_method_id: Optional[int]     = None
    amount:            Optional[Decimal] = None
    date:              Optional[date]    = None
    description:       Optional[str]     = None
    tag_ids:           Optional[List[int]] = None


class ExpenseResponse(ExpenseBase):
    id:      int
    user_id: int
    tags:    List[TagResponse] = []

    class Config:
        from_attributes = True


# ── Filter schema (used as query parameters) ──────────────────────────────────
class ExpenseFilter(BaseModel):
    category_id:  Optional[int]  = None
    account_id:   Optional[int]  = None
    tag_id:       Optional[int]  = None
    date_from:    Optional[date] = None
    date_to:      Optional[date] = None
