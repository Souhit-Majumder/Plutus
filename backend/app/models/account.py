# ─────────────────────────────────────────────────────────────────────────────
# models/account.py
#
# The ACCOUNT table.
# A user can have multiple accounts (e.g. Cash, Bank, Credit Card).
# Balance changes automatically when expenses/incomes are created.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Account(Base):
    __tablename__ = "account"

    id           = Column(Integer, primary_key=True, index=True)

    # Foreign key — links this account to its owner
    user_id      = Column(Integer, ForeignKey("user.id"), nullable=False)

    account_name = Column(String(100), nullable=False)

    # Examples: "cash", "bank", "credit_card", "savings"
    account_type = Column(String(50), nullable=False)

    # Numeric(12, 2) → up to 12 digits, 2 decimal places (e.g. 9999999999.99)
    # This is the running balance — updated on every expense/income.
    balance      = Column(Numeric(12, 2), default=0.00)

    created_at   = Column(DateTime, default=datetime.utcnow)

    # ── Relationships ──────────────────────────────────────────────────────────
    user              = relationship("User",             back_populates="accounts")
    expenses          = relationship("Expense",          back_populates="account")
    incomes           = relationship("Income",           back_populates="account")
    recurring_payments= relationship("RecurringPayment", back_populates="account")
