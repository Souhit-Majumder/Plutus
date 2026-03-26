from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.budget import (
    check_budget_status, create_budget, delete_budget,
    get_budget, get_budget_by_month_category, get_budgets, update_budget
)
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetStatus, BudgetUpdate

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])


@router.get("/", response_model=List[BudgetResponse])
def list_budgets(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all budgets for the logged-in user."""
    return get_budgets(db, current_user.id)


@router.post("/", response_model=BudgetResponse, status_code=201)
def create(data: BudgetCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Set a monthly budget for a category.
    month format: 'YYYY-MM'  e.g. '2024-06'
    """
    return create_budget(db, data, current_user.id)


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_one(budget_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    budget = get_budget(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update(budget_id: int, data: BudgetUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    budget = get_budget(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return update_budget(db, budget, data)


@router.delete("/{budget_id}", status_code=204)
def delete(budget_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    budget = get_budget(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    delete_budget(db, budget)


@router.get("/{budget_id}/status", response_model=BudgetStatus)
def check_status(budget_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Check whether the user has exceeded a budget.
    Returns: budget_amount, spent_amount, remaining, exceeded (bool).
    """
    budget = get_budget(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return check_budget_status(db, budget, current_user.id)
