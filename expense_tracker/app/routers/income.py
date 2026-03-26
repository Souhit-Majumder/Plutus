from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.income import create_income, delete_income, get_income, get_incomes, update_income
from app.schemas.income import IncomeCreate, IncomeResponse, IncomeUpdate

router = APIRouter(prefix="/api/income", tags=["Income"])


@router.get("/", response_model=List[IncomeResponse])
def list_incomes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_incomes(db, current_user.id)


@router.post("/", response_model=IncomeResponse, status_code=201)
def create(data: IncomeCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Add income — account balance increases automatically."""
    return create_income(db, data, current_user.id)


@router.get("/{income_id}", response_model=IncomeResponse)
def get_one(income_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    income = get_income(db, income_id, current_user.id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return income


@router.put("/{income_id}", response_model=IncomeResponse)
def update(income_id: int, data: IncomeUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    income = get_income(db, income_id, current_user.id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return update_income(db, income, data, current_user.id)


@router.delete("/{income_id}", status_code=204)
def delete(income_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Delete income — amount is deducted from account balance."""
    income = get_income(db, income_id, current_user.id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    delete_income(db, income, current_user.id)
