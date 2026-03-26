# ─────────────────────────────────────────────────────────────────────────────
# models/recurring_payment.py
#
# The RECURRING_PAYMENT table.
# Stores repeating expenses (e.g. Netflix subscription, rent, EMI).
#
# FREQUENCY values: "daily", "weekly", "monthly", "yearly"
# STATUS values:    "active", "inactive"
#
# On app startup, a function checks all active recurring payments and
# auto-creates expenses for any that are due (see services/recurring_service.py).
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class RecurringPayment(Base):
    __tablename__ = "recurring_payment"

    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(Integer, ForeignKey("user.id"),           nullable=False)
    account_id        = Column(Integer, ForeignKey("account.id"),        nullable=False)
    category_id       = Column(Integer, ForeignKey("category.id"),       nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_method.id"), nullable=True)

    amount            = Column(Numeric(12, 2), nullable=False)

    # How often the payment repeats: daily / weekly / monthly / yearly
    frequency         = Column(String(20), nullable=False)

    # When did the recurring payment start?
    start_date        = Column(Date, nullable=False)

    # Optional end date — NULL means it runs indefinitely
    end_date          = Column(Date, nullable=True)

    # Last time an expense was generated for this payment (used to detect due dates)
    last_triggered    = Column(Date, nullable=True)

    # "active" or "inactive" — users can pause/resume
    status            = Column(String(20), default="active")

    # ── Relationships ──────────────────────────────────────────────────────────
    user           = relationship("User",          back_populates="recurring_payments")
    account        = relationship("Account",       back_populates="recurring_payments")
    category       = relationship("Category",      back_populates="recurring_payments")
    payment_method = relationship("PaymentMethod", back_populates="recurring_payments")
