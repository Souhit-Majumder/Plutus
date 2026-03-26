# ─────────────────────────────────────────────────────────────────────────────
# crud/expense.py
#
# Database operations for expenses.
#
# KEY BEHAVIORS:
#   CREATE → deduct amount from account balance + attach tags
#   UPDATE → if amount changed, adjust account balance accordingly
#   DELETE → refund amount back to account balance
#   GET    → supports filtering by category, account, date range, and tag
#
# WHY BALANCE LOGIC LIVES HERE:
#   Keeping it in the CRUD layer ensures balance is ALWAYS updated
#   regardless of which service or router calls the function.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date
from decimal import Decimal
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.account import add_balance, deduct_balance, get_account
from app.models.expense import Expense
from app.models.tag import Tag
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


def _attach_tags(db: Session, expense: Expense, tag_ids: List[int], user_id: int):
    """
    Internal helper: resolve tag IDs to Tag objects and attach them to the expense.
    We validate each tag belongs to the user so users can't reference other users' tags.
    """
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids), Tag.user_id == user_id).all()
    expense.tags = tags  # SQLAlchemy handles the INSERT into expense_tag junction table


def get_expenses(
    db: Session,
    user_id: int,
    category_id: Optional[int] = None,
    account_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[Expense]:
    """
    Fetch expenses with optional filters.

    HOW FILTERING WORKS:
      We start with a base query filtered by user_id (security: never expose
      other users' data).  Then we conditionally chain .filter() calls.
      SQLAlchemy builds one efficient SQL query — filters are ANDed together.

      Example generated SQL (with all filters):
        SELECT * FROM expense
        WHERE user_id = :uid
          AND category_id = :cid
          AND account_id  = :aid
          AND date BETWEEN :from AND :to
          AND id IN (SELECT expense_id FROM expense_tag WHERE tag_id = :tid)
    """
    query = db.query(Expense).filter(Expense.user_id == user_id)

    if category_id:
        query = query.filter(Expense.category_id == category_id)

    if account_id:
        query = query.filter(Expense.account_id == account_id)

    if date_from:
        query = query.filter(Expense.date >= date_from)

    if date_to:
        query = query.filter(Expense.date <= date_to)

    if tag_id:
        # Filter expenses that have a specific tag via the junction table
        # SQLAlchemy uses the 'tags' relationship to build the JOIN
        query = query.filter(Expense.tags.any(Tag.id == tag_id))

    return query.order_by(Expense.date.desc()).all()


def get_expense(db: Session, expense_id: int, user_id: int) -> Optional[Expense]:
    return db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == user_id
    ).first()


def create_expense(db: Session, data: ExpenseCreate, user_id: int) -> Expense:
    """
    Create an expense and deduct the amount from the account balance.

    Steps:
      1. Build the Expense model.
      2. Add & flush (so we get an expense.id before committing).
      3. Attach tags via the junction table.
      4. Deduct from account balance.
      5. Commit everything atomically.
    """

    account = get_account(db, data.account_id, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    expense = Expense(
        user_id           = user_id,
        account_id        = data.account_id,
        category_id       = data.category_id,
        payment_method_id = data.payment_method_id,
        amount            = data.amount,
        date              = data.date,
        description       = data.description,
    )

    if account.balance < data.amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient funds! You only have {account.balance} remaining."
        )
    
    db.add(expense)
    db.flush()  # flush assigns expense.id without committing yet

    # Attach tags (many-to-many)
    if data.tag_ids:
        _attach_tags(db, expense, data.tag_ids, user_id)

    # Deduct from account balance
    account = get_account(db, data.account_id, user_id)
    if account:
        deduct_balance(db, account, data.amount)

    db.commit()
    db.refresh(expense)
    return expense


def update_expense(db: Session, expense: Expense, data: ExpenseUpdate, user_id: int) -> Expense:
    """
    Update expense fields.
    If the amount changes, adjust the account balance:
      - Refund the OLD amount back to the account.
      - Deduct the NEW amount from the account.
    """
    old_amount     = Decimal(str(expense.amount))
    old_account_id = expense.account_id

    for field, value in data.model_dump(exclude_unset=True, exclude={"tag_ids"}).items():
        setattr(expense, field, value)

    # Handle tag updates
    if data.tag_ids is not None:
        _attach_tags(db, expense, data.tag_ids, user_id)

    # Balance adjustment if amount or account changed
    new_amount     = Decimal(str(expense.amount))
    new_account_id = expense.account_id

    if old_account_id == new_account_id:
        # Same account: net adjust (refund old, deduct new)
        account = get_account(db, new_account_id, user_id)
        if account:
            add_balance(db, account, old_amount)      # refund old
            deduct_balance(db, account, new_amount)   # deduct new
    else:
        # Account changed: refund old account, deduct new account
        old_account = get_account(db, old_account_id, user_id)
        new_account = get_account(db, new_account_id, user_id)
        if old_account:
            add_balance(db, old_account, old_amount)
        if new_account:
            deduct_balance(db, new_account, new_amount)

    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense: Expense, user_id: int):
    """
    Delete expense and REFUND the amount back to the account.
    If we didn't refund, the account balance would be permanently wrong.
    """
    account = get_account(db, expense.account_id, user_id)
    if account:
        add_balance(db, account, Decimal(str(expense.amount)))

    db.delete(expense)
    db.commit()
