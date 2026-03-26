# ─────────────────────────────────────────────────────────────────────────────
# models/person.py
#
# The PERSON table.
# Stores contacts the user tracks loans with (friends, family, etc.).
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Person(Base):
    __tablename__ = "person"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("user.id"), nullable=False)
    person_name = Column(String(100), nullable=False)
    phone       = Column(String(20), nullable=True)
    description = Column(String(255), nullable=True)
    notes       = Column(String(500), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    user  = relationship("User",  back_populates="persons")
    loans = relationship("Loan",  back_populates="person", cascade="all, delete-orphan")
