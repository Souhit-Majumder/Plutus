from typing import Optional
from pydantic import BaseModel


class CategoryBase(BaseModel):
    category_name: str
    category_note: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    category_note: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
