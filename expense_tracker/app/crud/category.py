from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_categories(db: Session, user_id: int) -> List[Category]:
    return db.query(Category).filter(Category.user_id == user_id).all()


def get_category(db: Session, category_id: int, user_id: int) -> Optional[Category]:
    return db.query(Category).filter(
        Category.id == category_id, Category.user_id == user_id
    ).first()


def create_category(db: Session, data: CategoryCreate, user_id: int) -> Category:
    cat = Category(user_id=user_id, **data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def update_category(db: Session, cat: Category, data: CategoryUpdate) -> Category:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, cat: Category):
    db.delete(cat)
    db.commit()
