# ─────────────────────────────────────────────────────────────────────────────
# models/expense.py
#
# The EXPENSE table and the EXPENSE_TAG junction table.
#
# MANY-TO-MANY EXPLAINED:
#   An expense can have multiple tags (e.g. "groceries", "monthly").
#   A tag can belong to multiple expenses.
#   This is a many-to-many relationship.
#
#   In SQL, many-to-many needs a junction/association table:
#       expense_tag(expense_id, tag_id)
#   Each row says "expense X is linked to tag Y".
#
# HOW SQLAlchemy HANDLES IT:
#   We define ExpenseTag as a Table (not a full model class, since it has
#   no extra columns).  Then in both Expense and Tag, we add:
#       relationship(..., secondary="expense_tag")
#   SQLAlchemy uses the secondary table to JOIN automatically.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Table
from sqlalchemy.orm import relationship

from app.database import Base

# ── Junction table (many-to-many: Expense ↔ Tag) ─────────────────────────────
# This is a simple Table object, not a full model class, because it only
# has two foreign key columns and no extra attributes.
ExpenseTag = Table(
    "expense_tag",
    Base.metadata,
    Column("expense_id", Integer, ForeignKey("expense.id"), primary_key=True),
    Column("tag_id",     Integer, ForeignKey("tag.id"),     primary_key=True),
)


class Expense(Base):
    __tablename__ = "expense"

    id                = Column(Integer, primary_key=True, index=True)

    # Who created this expense
    user_id           = Column(Integer, ForeignKey("user.id"),           nullable=False)

    # Which account was debited
    account_id        = Column(Integer, ForeignKey("account.id"),        nullable=False)

    # What category it belongs to (e.g. Food, Travel)
    category_id       = Column(Integer, ForeignKey("category.id"),       nullable=False)

    # How was it paid (optional)
    payment_method_id = Column(Integer, ForeignKey("payment_method.id"), nullable=True)

    # The amount spent
    amount            = Column(Numeric(12, 2), nullable=False)

    # The date the expense occurred (not necessarily today)
    date              = Column(Date, nullable=False)

    description       = Column(String(255), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    user           = relationship("User",          back_populates="expenses")
    account        = relationship("Account",       back_populates="expenses")
    category       = relationship("Category",      back_populates="expenses")
    payment_method = relationship("PaymentMethod", back_populates="expenses")
    notes          = relationship("TransactionNote", back_populates="expense", cascade="all, delete-orphan")

    # Many-to-many with Tag via the expense_tag junction table
    tags = relationship(
        "Tag",
        secondary="expense_tag",   # SQLAlchemy uses this table for JOINs
        back_populates="expenses",
    )
