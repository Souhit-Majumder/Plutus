# ─────────────────────────────────────────────────────────────────────────────
# models/income.py
#
# The INCOME table.
# When an income is recorded, the linked account's balance increases.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Income(Base):
    __tablename__ = "income"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("user.id"),    nullable=False)
    account_id  = Column(Integer, ForeignKey("account.id"), nullable=False)
    amount      = Column(Numeric(12, 2), nullable=False)
    date        = Column(Date, nullable=False)
    description = Column(String(255), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    user    = relationship("User",    back_populates="incomes")
    account = relationship("Account", back_populates="incomes")
