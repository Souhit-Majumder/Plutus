# ─────────────────────────────────────────────────────────────────────────────
# crud/income.py
#
# Database operations for income records.
# CREATE → add amount to account balance
# DELETE → subtract amount from account balance (undo)
# UPDATE → net-adjust balance if amount changes
# ─────────────────────────────────────────────────────────────────────────────

from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import Session

from app.crud.account import add_balance, deduct_balance, get_account
from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate


def get_incomes(db: Session, user_id: int) -> List[Income]:
    return (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .order_by(Income.date.desc())
        .all()
    )


def get_income(db: Session, income_id: int, user_id: int) -> Optional[Income]:
    return db.query(Income).filter(
        Income.id == income_id, Income.user_id == user_id
    ).first()


def create_income(db: Session, data: IncomeCreate, user_id: int) -> Income:
    """Create income record and ADD the amount to the account balance."""
    income = Income(user_id=user_id, **data.model_dump())
    db.add(income)
    db.flush()

    # Credit the account
    account = get_account(db, data.account_id, user_id)
    if account:
        add_balance(db, account, Decimal(str(data.amount)))

    db.commit()
    db.refresh(income)
    return income


def update_income(db: Session, income: Income, data: IncomeUpdate, user_id: int) -> Income:
    old_amount = Decimal(str(income.amount))
    old_account_id = income.account_id

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(income, field, value)

    new_amount = Decimal(str(income.amount))
    new_account_id = income.account_id

    if old_account_id == new_account_id:
        account = get_account(db, new_account_id, user_id)
        if account:
            deduct_balance(db, account, old_amount)   # undo old credit
            add_balance(db, account, new_amount)      # apply new credit
    else:
        old_acc = get_account(db, old_account_id, user_id)
        new_acc = get_account(db, new_account_id, user_id)
        if old_acc:
            deduct_balance(db, old_acc, old_amount)
        if new_acc:
            add_balance(db, new_acc, new_amount)

    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, income: Income, user_id: int):
    """Delete income and DEDUCT the amount from the account (undo the credit)."""
    account = get_account(db, income.account_id, user_id)
    if account:
        deduct_balance(db, account, Decimal(str(income.amount)))
    db.delete(income)
    db.commit()
