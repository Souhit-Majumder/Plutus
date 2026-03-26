from typing import Optional
from pydantic import BaseModel


class PaymentMethodBase(BaseModel):
    method_name: str


class PaymentMethodCreate(PaymentMethodBase):
    pass


class PaymentMethodUpdate(BaseModel):
    method_name: Optional[str] = None


class PaymentMethodResponse(PaymentMethodBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
