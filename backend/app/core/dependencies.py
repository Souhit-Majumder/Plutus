# ─────────────────────────────────────────────────────────────────────────────
# core/dependencies.py
#
# FastAPI uses "dependency injection" — you declare what a route needs,
# and FastAPI resolves it automatically.
#
# Here we define:
#   get_db          — yields a SQLAlchemy database session for each request
#   get_current_user — reads the JWT from the request and returns the logged-in user
#
# WHY DEPENDENCY INJECTION?
#   It keeps route handlers clean.  Instead of writing DB/auth logic in every
#   route, you just add  `db: Session = Depends(get_db)`  as a parameter.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import SessionLocal

# OAuth2PasswordBearer tells FastAPI where to look for the token.
# tokenUrl is the login endpoint path — used by Swagger UI's "Authorize" button.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Database session ──────────────────────────────────────────────────────────

def get_db():
    """
    Yield a database session for the duration of a single request.

    The 'yield' makes this a generator — FastAPI will:
      1. Call get_db() → open a session → inject it into the route
      2. After the route finishes → resume after yield → close the session

    Using 'finally' ensures the session is ALWAYS closed, even on errors.
    This prevents connection leaks.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Current user ──────────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Dependency that:
      1. Extracts the JWT from the Authorization header
      2. Decodes and validates the token
      3. Looks up the user in the database
      4. Returns the user object (or raises 401 if anything fails)

    Any route that adds  `current_user = Depends(get_current_user)`
    is automatically protected — unauthenticated requests get a 401 error.
    """
    # Import here to avoid circular imports
    from app.crud.user import get_user_by_id

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode the token — returns None if invalid/expired
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # The token's 'sub' field holds the user's ID (set during login)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Fetch the user from the database
    user = get_user_by_id(db, int(user_id))
    if user is None:
        raise credentials_exception

    return user
