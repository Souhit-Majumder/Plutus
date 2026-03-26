from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_user, get_db
from app.crud.payment_method import (
    create_payment_method, delete_payment_method,
    get_payment_method, get_payment_methods, update_payment_method
)
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodResponse, PaymentMethodUpdate

router = APIRouter(prefix="/api/payment-methods", tags=["Payment Methods"])


@router.get("/", response_model=List[PaymentMethodResponse])
def list_pms(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_payment_methods(db, current_user.id)


@router.post("/", response_model=PaymentMethodResponse, status_code=201)
def create(data: PaymentMethodCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_payment_method(db, data, current_user.id)


@router.put("/{pm_id}", response_model=PaymentMethodResponse)
def update(pm_id: int, data: PaymentMethodUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    pm = get_payment_method(db, pm_id, current_user.id)
    if not pm:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return update_payment_method(db, pm, data)


@router.delete("/{pm_id}", status_code=204)
def delete(pm_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    pm = get_payment_method(db, pm_id, current_user.id)
    if not pm:
        raise HTTPException(status_code=404, detail="Payment method not found")
    delete_payment_method(db, pm)
