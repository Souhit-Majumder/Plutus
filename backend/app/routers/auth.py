# ─────────────────────────────────────────────────────────────────────────────
# routers/auth.py
#
# Authentication endpoints:
#   POST /api/auth/register  — create a new account
#   POST /api/auth/login     — get a JWT token
#   GET  /api/auth/me        — get the currently logged-in user
#
# HOW LOGIN WORKS STEP BY STEP:
#   1. Client sends email + password (as form data, OAuth2 standard).
#   2. We look up the user by email.
#   3. We verify the password against the stored bcrypt hash.
#   4. If valid, we create a JWT token with the user's ID in the payload.
#   5. We return the token — the client stores it and sends it on every request.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.security import create_access_token, verify_password
from app.crud.user import create_user, get_user_by_email
from app.schemas.user import Token, UserCreate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    Returns the created user (without password).
    Raises 400 if the email is already taken.
    """
    if get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return create_user(db, data)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Login with email (username field) and password.
    Returns a JWT access token on success.

    OAuth2PasswordRequestForm expects:
      username=<email>  (we use email as the username)
      password=<password>
    """
    # Step 1: Find the user
    user = get_user_by_email(db, form_data.username)

    # Step 2: Verify password — check hash match
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 3: Create JWT — embed user ID as 'sub' (subject claim)
    token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    """Return the profile of the currently logged-in user."""
    return current_user
