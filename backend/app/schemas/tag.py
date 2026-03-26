from typing import Optional
from pydantic import BaseModel


class TagBase(BaseModel):
    tag_name: str


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    tag_name: Optional[str] = None


class TagResponse(TagBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
