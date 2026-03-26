# ─────────────────────────────────────────────────────────────────────────────
# models/payment_method.py
#
# The PAYMENT_METHOD table.
# Stores payment methods per user (e.g. UPI, Cash, Credit Card, Net Banking).
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class PaymentMethod(Base):
    __tablename__ = "payment_method"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("user.id"), nullable=False)
    method_name = Column(String(100), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────────
    user              = relationship("User",             back_populates="payment_methods")
    expenses          = relationship("Expense",          back_populates="payment_method")
    recurring_payments= relationship("RecurringPayment", back_populates="payment_method")
