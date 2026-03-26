from typing import Optional
from pydantic import BaseModel


class PersonBase(BaseModel):
    person_name: str
    phone:       Optional[str] = None
    description: Optional[str] = None
    notes:       Optional[str] = None


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    person_name: Optional[str] = None
    phone:       Optional[str] = None
    description: Optional[str] = None
    notes:       Optional[str] = None


class PersonResponse(PersonBase):
    id:      int
    user_id: int

    class Config:
        from_attributes = True
