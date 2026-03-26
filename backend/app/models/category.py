# ─────────────────────────────────────────────────────────────────────────────
# models/category.py
#
# The CATEGORY table.
# Categories help organise expenses and budgets (e.g. Food, Transport, Rent).
# Each user manages their own category list.
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Category(Base):
    __tablename__ = "category"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("user.id"), nullable=False)
    category_name = Column(String(100), nullable=False)
    category_note = Column(String(255), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    user              = relationship("User",             back_populates="categories")
    expenses          = relationship("Expense",          back_populates="category")
    recurring_payments= relationship("RecurringPayment", back_populates="category")
    budgets           = relationship("Budget",           back_populates="category")
    savings_goals     = relationship("SavingsGoal",      back_populates="category")
