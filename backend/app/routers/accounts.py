from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_user, get_db
from app.crud.account import (
    create_account, delete_account, get_account, get_accounts, update_account
)
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


@router.get("/", response_model=List[AccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all accounts for the logged-in user."""
    return get_accounts(db, current_user.id)


@router.post("/", response_model=AccountResponse, status_code=201)
def create(
    data: AccountCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_account(db, data, current_user.id)


@router.get("/{account_id}", response_model=AccountResponse)
def get_one(
    account_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = get_account(db, account_id, current_user.id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
def update(
    account_id: int,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = get_account(db, account_id, current_user.id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return update_account(db, account, data)


@router.delete("/{account_id}", status_code=204)
def delete(
    account_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = get_account(db, account_id, current_user.id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    delete_account(db, account)
