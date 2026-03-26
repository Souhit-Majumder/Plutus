# ─────────────────────────────────────────────────────────────────────────────
# models/user.py
#
# The USER table — the central entity of the entire system.
# Every other table links back to a user via user_id (foreign key).
#
# In SQLAlchemy "declarative" style, each class = one database table.
# Class attributes decorated with Column() = table columns.
# relationship() = a Python-level link; SQLAlchemy handles the JOIN for us.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    # __tablename__ tells SQLAlchemy (and MySQL) what to call the table
    __tablename__ = "user"

    # Primary key — auto-incremented integer ID
    id = Column(Integer, primary_key=True, index=True)

    # User's full name
    name = Column(String(100), nullable=False)

    # Email must be unique so we can use it as a login identifier
    email = Column(String(150), unique=True, nullable=False, index=True)

    # We store ONLY the bcrypt hash, never the plain-text password
    password = Column(String(255), nullable=False)

    # Optional phone number
    phone = Column(String(20), nullable=True)

    # Automatically set to the current time when the record is created
    created_at = Column(DateTime, default=datetime.utcnow)

    # ── Relationships ──────────────────────────────────────────────────────────
    # These are Python-level shortcuts — SQLAlchemy uses the foreign keys
    # to figure out how to JOIN.  They don't add extra columns.
    #
    # back_populates='user' means the other side also has a relationship
    # attribute named 'user' pointing back here.
    #
    # cascade='all, delete-orphan' means: if a User is deleted,
    # all their related records are deleted too.
    accounts          = relationship("Account",          back_populates="user", cascade="all, delete-orphan")
    categories        = relationship("Category",         back_populates="user", cascade="all, delete-orphan")
    payment_methods   = relationship("PaymentMethod",    back_populates="user", cascade="all, delete-orphan")
    expenses          = relationship("Expense",          back_populates="user", cascade="all, delete-orphan")
    incomes           = relationship("Income",           back_populates="user", cascade="all, delete-orphan")
    recurring_payments= relationship("RecurringPayment", back_populates="user", cascade="all, delete-orphan")
    budgets           = relationship("Budget",           back_populates="user", cascade="all, delete-orphan")
    savings_goals     = relationship("SavingsGoal",      back_populates="user", cascade="all, delete-orphan")
    tags              = relationship("Tag",              back_populates="user", cascade="all, delete-orphan")
    loans             = relationship("Loan",             back_populates="user", cascade="all, delete-orphan")
    persons           = relationship("Person",           back_populates="user", cascade="all, delete-orphan")
    reminders         = relationship("Reminder",         back_populates="user", cascade="all, delete-orphan")
