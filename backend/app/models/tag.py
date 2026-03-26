# ─────────────────────────────────────────────────────────────────────────────
# models/tag.py
#
# The TAG table.
# Tags are flexible labels users can attach to expenses (many-to-many).
# The junction table (EXPENSE_TAG) is defined in models/expense.py.
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Tag(Base):
    __tablename__ = "tag"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("user.id"), nullable=False)
    tag_name = Column(String(50), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────────
    user     = relationship("User",    back_populates="tags")

    # 'expenses' here is populated via the ExpenseTag association table
    # secondary= tells SQLAlchemy to use the junction table for the JOIN
    expenses = relationship(
        "Expense",
        secondary="expense_tag",   # name of the junction table
        back_populates="tags",
    )
