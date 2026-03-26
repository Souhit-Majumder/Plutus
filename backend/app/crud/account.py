# ─────────────────────────────────────────────────────────────────────────────
# crud/account.py
#
# Database operations for accounts.
# Also contains the balance update helpers — called whenever an expense
# or income is created/deleted/updated.
# ─────────────────────────────────────────────────────────────────────────────

from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate


def get_accounts(db: Session, user_id: int) -> List[Account]:
    """Return all accounts belonging to a user."""
    return db.query(Account).filter(Account.user_id == user_id).all()


def get_account(db: Session, account_id: int, user_id: int) -> Optional[Account]:
    """
    Get a specific account.
    We ALWAYS filter by user_id too — this prevents one user from accessing
    another user's accounts (authorization check at the data layer).
    """
    return (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == user_id)
        .first()
    )


def create_account(db: Session, data: AccountCreate, user_id: int) -> Account:
    account = Account(
        user_id      = user_id,
        account_name = data.account_name,
        account_type = data.account_type,
        balance      = data.balance,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def update_account(db: Session, account: Account, data: AccountUpdate) -> Account:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account


def delete_account(db: Session, account: Account):
    db.delete(account)
    db.commit()


# ── Balance helpers ────────────────────────────────────────────────────────────

def deduct_balance(db: Session, account: Account, amount: Decimal):
    """
    Decrease account balance by 'amount'.
    Called when an expense is CREATED.
    We cast to Decimal to ensure accurate arithmetic (avoids float rounding bugs).
    """
    account.balance = Decimal(str(account.balance)) - Decimal(str(amount))
    db.commit()


def add_balance(db: Session, account: Account, amount: Decimal):
    """
    Increase account balance by 'amount'.
    Called when income is CREATED or an expense is DELETED.
    """
    account.balance = Decimal(str(account.balance)) + Decimal(str(amount))
    db.commit()
