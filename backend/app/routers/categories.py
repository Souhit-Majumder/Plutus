from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_user, get_db
from app.crud.category import create_category, delete_category, get_categories, get_category, update_category
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("/", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_categories(db, current_user.id)


@router.post("/", response_model=CategoryResponse, status_code=201)
def create(data: CategoryCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_category(db, data, current_user.id)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_one(category_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cat = get_category(db, category_id, current_user.id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.put("/{category_id}", response_model=CategoryResponse)
def update(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cat = get_category(db, category_id, current_user.id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return update_category(db, cat, data)


@router.delete("/{category_id}", status_code=204)
def delete(category_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cat = get_category(db, category_id, current_user.id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    delete_category(db, cat)
