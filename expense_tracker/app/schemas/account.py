from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class AccountBase(BaseModel):
    account_name: str
    account_type: str


class AccountCreate(AccountBase):
    # Initial balance when creating an account (default 0)
    balance: Optional[Decimal] = Decimal("0.00")


class AccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[str] = None


class AccountResponse(AccountBase):
    id: int
    user_id: int
    balance: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
