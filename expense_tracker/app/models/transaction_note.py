# ─────────────────────────────────────────────────────────────────────────────
# models/transaction_note.py
#
# The TRANSACTION_NOTE table.
# Allows users to attach extra notes/receipts to expenses.
# One expense can have multiple notes.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class TransactionNote(Base):
    __tablename__ = "transaction_note"

    id         = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expense.id"), nullable=False)
    note_type  = Column(String(50), nullable=True)   # e.g. "receipt", "memo"
    note_text  = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ── Relationships ──────────────────────────────────────────────────────────
    expense = relationship("Expense", back_populates="notes")
