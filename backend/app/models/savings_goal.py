# ─────────────────────────────────────────────────────────────────────────────
# models/savings_goal.py
#
# The SAVINGS_GOAL table.
# Users set a savings target (e.g. "Save ₹50,000 for a laptop by Dec 2024").
# They can add money toward the goal; the API tracks the remaining amount.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class SavingsGoal(Base):
    __tablename__ = "savings_goal"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("user.id"),     nullable=False)
    category_id    = Column(Integer, ForeignKey("category.id"), nullable=True)

    goal_name      = Column(String(150), nullable=False)

    # How much the user wants to save in total
    target_amount  = Column(Numeric(12, 2), nullable=False)

    # Running total of money already saved toward this goal
    saved_amount   = Column(Numeric(12, 2), default=0.00)

    # Optional target date
    deadline       = Column(Date, nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    user     = relationship("User",     back_populates="savings_goals")
    category = relationship("Category", back_populates="savings_goals")

    @property
    def remaining_amount(self):
        """
        Computed property: how much more the user needs to save.
        This is a Python property — not a real database column.
        """
        return float(self.target_amount) - float(self.saved_amount)
