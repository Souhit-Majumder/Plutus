# ─────────────────────────────────────────────────────────────────────────────
# models/loan.py
#
# The LOAN table.
# Tracks money lent to others or borrowed from others.
#
# loan_type:
#   "lent"     — user gave money to someone (they owe you)
#   "borrowed" — user received money from someone (you owe them)
#
# status:
#   "active"   — loan not yet repaid
#   "repaid"   — loan fully repaid
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Loan(Base):
    __tablename__ = "loan"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("user.id"),   nullable=False)
    person_id   = Column(Integer, ForeignKey("person.id"), nullable=False)

    # "lent" or "borrowed"
    loan_type   = Column(String(20), nullable=False)

    amount      = Column(Numeric(12, 2), nullable=False)

    # Optional due date for repayment
    due_date    = Column(Date, nullable=True)

    description = Column(String(255), nullable=True)

    # "active" or "repaid"
    status      = Column(String(20), default="active")

    # When was the loan recorded?
    loan_date   = Column(Date, nullable=True)

    # When was it repaid? (NULL until repaid)
    repaid_date = Column(Date, nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    user   = relationship("User",   back_populates="loans")
    person = relationship("Person", back_populates="loans")
