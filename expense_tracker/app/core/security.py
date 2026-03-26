# ─────────────────────────────────────────────────────────────────────────────
# core/security.py
#
# This file handles two security concerns:
#   1. Password hashing   — so we NEVER store plain-text passwords
#   2. JWT token creation — so authenticated users carry a signed proof of identity
#
# WHY JWT?
#   HTTP is stateless — the server forgets you between requests.
#   Instead of storing sessions on the server, we give the client a signed token.
#   The client sends the token on every request; the server verifies the signature.
#   This scales well (no shared session store needed).
#
# WHY HASH PASSWORDS?
#   If the database is ever leaked, hashed passwords are useless to attackers
#   (bcrypt is intentionally slow, making brute-force infeasible).
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timedelta
from typing import Optional

import bcrypt  # Replaced passlib with direct bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """
    Take a plain-text password and return its bcrypt hash.
    Bcrypt handles the salt generation automatically.
    """
    # 1. Convert string to bytes
    pwd_bytes = plain_password.encode('utf-8')
    # 2. Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    # 3. Return as a string to store in the DB
    return hashed_password.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check whether a plain-text password matches the stored hash.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        # Returns False if the hash is malformed or comparison fails
        return False


# ── JWT token ─────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token.
    """
    to_encode = data.copy()

    # Set expiry time
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None