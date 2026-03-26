from datetime import date
from typing import Optional
from pydantic import BaseModel


class ReminderBase(BaseModel):
    reminder_type: Optional[str] = None
    reminder_date: date
    description:   Optional[str] = None
    notes:         Optional[str] = None


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    reminder_type: Optional[str]  = None
    reminder_date: Optional[date] = None
    description:   Optional[str]  = None
    notes:         Optional[str]  = None
    status:        Optional[str]  = None


class ReminderResponse(ReminderBase):
    id:      int
    user_id: int
    status:  str

    class Config:
        from_attributes = True
