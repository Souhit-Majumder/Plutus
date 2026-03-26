# ─────────────────────────────────────────────────────────────────────────────
# schemas/user.py
#
# Pydantic schemas for the User entity.
#
# WHY PYDANTIC SCHEMAS?
#   SQLAlchemy models describe the DATABASE shape.
#   Pydantic schemas describe the API shape (what comes IN and goes OUT).
#   Keeping them separate lets us:
#     • Hide sensitive fields (e.g. password hash is never returned)
#     • Validate incoming data (e.g. email format, required fields)
#     • Version the API independently of the database
#
# PATTERN (used throughout the project):
#   Base       — shared fields
#   Create     — what the client sends when creating a record (+ write-only fields)
#   Update     — what the client sends when editing (all fields optional)
#   Response   — what the API returns (never includes password)
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None


class UserCreate(UserBase):
    # Password is accepted on creation but NEVER returned in responses
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        # orm_mode (v1) / from_attributes (v2) — allows Pydantic to read
        # data from SQLAlchemy model instances (not just dicts)
        from_attributes = True


# ── Auth schemas ───────────────────────────────────────────────────────────────

class Token(BaseModel):
    """Returned after a successful login."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded contents of a JWT token."""
    user_id: Optional[int] = None
