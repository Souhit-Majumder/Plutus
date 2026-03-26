# ─────────────────────────────────────────────────────────────────────────────
# routers/expenses.py
#
# Expense endpoints with filtering support.
# Filters are passed as query parameters:
#   GET /api/expenses?category_id=2&date_from=2024-01-01&date_to=2024-01-31
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.expense import (
    create_expense, delete_expense, get_expense, get_expenses, update_expense
)
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


@router.get("/", response_model=List[ExpenseResponse])
def list_expenses(
    # Optional query-parameter filters — FastAPI reads these from the URL
    category_id:  Optional[int]  = Query(None, description="Filter by category"),
    account_id:   Optional[int]  = Query(None, description="Filter by account"),
    tag_id:       Optional[int]  = Query(None, description="Filter by tag"),
    date_from:    Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to:      Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user  = Depends(get_current_user),
):
    """
    Get all expenses for the logged-in user.
    Supports optional filters: category, account, tag, date range.

    Example: GET /api/expenses?category_id=3&date_from=2024-06-01&date_to=2024-06-30
    """
    return get_expenses(
        db,
        user_id     = current_user.id,
        category_id = category_id,
        account_id  = account_id,
        tag_id      = tag_id,
        date_from   = date_from,
        date_to     = date_to,
    )


@router.post("/", response_model=ExpenseResponse, status_code=201)
def create(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Create a new expense.
    Account balance is automatically decreased by the expense amount.
    Tags can be attached by passing tag_ids in the request body.
    """
    return create_expense(db, data, current_user.id)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_one(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    expense = get_expense(db, expense_id, current_user.id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Update an expense.
    If the amount changes, the account balance is adjusted automatically.
    """
    expense = get_expense(db, expense_id, current_user.id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return update_expense(db, expense, data, current_user.id)


@router.delete("/{expense_id}", status_code=204)
def delete(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Delete an expense.
    The amount is refunded back to the account balance.
    """
    expense = get_expense(db, expense_id, current_user.id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    delete_expense(db, expense, current_user.id)
