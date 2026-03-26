# ─────────────────────────────────────────────────────────────────────────────
# models/reminder.py
#
# The REMINDER table.
# Users can set reminders for bill payments, loan due dates, etc.
#
# reminder_type : e.g. "bill", "loan", "subscription", "custom"
# status        : "pending" or "completed"
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Reminder(Base):
    __tablename__ = "reminder"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("user.id"), nullable=False)

    reminder_type = Column(String(50), nullable=True)   # e.g. "bill", "loan"
    reminder_date = Column(Date,       nullable=False)  # when to remind
    description   = Column(String(255), nullable=True)

    # "pending" → not yet done  |  "completed" → user marked it done
    status        = Column(String(20), default="pending")

    notes         = Column(String(500), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    user = relationship("User", back_populates="reminders")
