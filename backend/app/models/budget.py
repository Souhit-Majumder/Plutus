# ─────────────────────────────────────────────────────────────────────────────
# models/budget.py
#
# The BUDGET table.
# Users set a spending limit per category per month.
# The API can check if actual spending exceeds the budget.
#
# month is stored as "YYYY-MM" string (e.g. "2024-06") for easy querying.
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import Column, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Budget(Base):
    __tablename__ = "budget"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("user.id"),      nullable=False)
    category_id = Column(Integer, ForeignKey("category.id"),  nullable=False)

    # Budget limit for the month
    amount      = Column(Numeric(12, 2), nullable=False)

    # Format: "YYYY-MM" — e.g. "2024-06"
    month       = Column(String(7), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────────
    user     = relationship("User",     back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
