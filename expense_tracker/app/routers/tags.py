# ─────────────────────────────────────────────────────────────────────────────
# routers/tags.py
#
# Tag management + assigning/removing tags from expenses.
#
# MANY-TO-MANY RECAP:
#   Expense ↔ Tag relationship is managed via the expense_tag junction table.
#   SQLAlchemy handles the INSERT/DELETE on that table automatically when we
#   modify expense.tags (the relationship list).
# ─────────────────────────────────────────────────────────────────────────────

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.tag import create_tag, delete_tag, get_tag, get_tags, update_tag
from app.crud.expense import get_expense
from app.schemas.tag import TagCreate, TagResponse, TagUpdate
from app.schemas.expense import ExpenseResponse

router = APIRouter(prefix="/api/tags", tags=["Tags"])


@router.get("/", response_model=List[TagResponse])
def list_tags(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_tags(db, current_user.id)


@router.post("/", response_model=TagResponse, status_code=201)
def create(data: TagCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_tag(db, data, current_user.id)


@router.put("/{tag_id}", response_model=TagResponse)
def update(tag_id: int, data: TagUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    tag = get_tag(db, tag_id, current_user.id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return update_tag(db, tag, data)


@router.delete("/{tag_id}", status_code=204)
def delete(tag_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    tag = get_tag(db, tag_id, current_user.id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    delete_tag(db, tag)


@router.post("/{tag_id}/assign/{expense_id}", response_model=ExpenseResponse)
def assign_tag_to_expense(
    tag_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Assign a tag to an expense.
    SQLAlchemy inserts a row into the expense_tag junction table automatically.
    """
    tag     = get_tag(db, tag_id, current_user.id)
    expense = get_expense(db, expense_id, current_user.id)

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Add tag only if not already assigned (avoid duplicates)
    if tag not in expense.tags:
        expense.tags.append(tag)
        db.commit()
        db.refresh(expense)

    return expense


@router.delete("/{tag_id}/remove/{expense_id}", response_model=ExpenseResponse)
def remove_tag_from_expense(
    tag_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Remove a tag from an expense.
    SQLAlchemy deletes the row from expense_tag automatically.
    """
    tag     = get_tag(db, tag_id, current_user.id)
    expense = get_expense(db, expense_id, current_user.id)

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if tag in expense.tags:
        expense.tags.remove(tag)
        db.commit()
        db.refresh(expense)

    return expense


@router.get("/{tag_id}/expenses", response_model=List[ExpenseResponse])
def expenses_by_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all expenses that have a specific tag."""
    from app.crud.expense import get_expenses
    tag = get_tag(db, tag_id, current_user.id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return get_expenses(db, user_id=current_user.id, tag_id=tag_id)
