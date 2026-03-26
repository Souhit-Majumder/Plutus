# ─────────────────────────────────────────────────────────────────────────────
# crud/user.py
#
# CRUD = Create, Read, Update, Delete
# This layer talks ONLY to the database — no HTTP, no business logic.
# Routers call these functions; they never talk to the DB directly.
#
# WHY A SEPARATE CRUD LAYER?
#   Separation of concerns: if you swap MySQL for PostgreSQL, you only
#   change this layer, not the routers or business logic.
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: int):
    """Fetch a single user by their primary key."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    """Fetch a user by email — used during login to find who is trying to log in."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, data: UserCreate) -> User:
    """
    Create a new user.
    Steps:
      1. Hash the plain-text password — we NEVER store it raw.
      2. Build a User model instance.
      3. Add it to the session (staged for INSERT).
      4. Commit → executes the INSERT.
      5. Refresh → re-reads the row from DB (so 'id' and 'created_at' are populated).
    """
    hashed = hash_password(data.password)
    user = User(
        name     = data.name,
        email    = data.email,
        password = hashed,
        phone    = data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    """
    Update only the fields that were provided.
    model_dump(exclude_unset=True) returns only fields the client actually sent,
    so we don't accidentally overwrite fields with None.
    """
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
