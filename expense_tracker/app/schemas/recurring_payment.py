from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class RecurringPaymentBase(BaseModel):
    account_id:        int
    category_id:       int
    payment_method_id: Optional[int] = None
    amount:            Decimal
    frequency:         str   # daily / weekly / monthly / yearly
    start_date:        date
    end_date:          Optional[date] = None


class RecurringPaymentCreate(RecurringPaymentBase):
    pass


class RecurringPaymentUpdate(BaseModel):
    amount:            Optional[Decimal] = None
    frequency:         Optional[str]    = None
    end_date:          Optional[date]   = None
    status:            Optional[str]    = None  # "active" or "inactive"


class RecurringPaymentResponse(RecurringPaymentBase):
    id:             int
    user_id:        int
    last_triggered: Optional[date] = None
    status:         str

    class Config:
        from_attributes = True
