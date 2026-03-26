from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.recurring_payment import (
    create_recurring_payment, delete_recurring_payment,
    get_recurring_payment, get_recurring_payments, update_recurring_payment
)
from app.schemas.recurring_payment import (
    RecurringPaymentCreate, RecurringPaymentResponse, RecurringPaymentUpdate
)

router = APIRouter(prefix="/api/recurring-payments", tags=["Recurring Payments"])


@router.get("/", response_model=List[RecurringPaymentResponse])
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_recurring_payments(db, current_user.id)


@router.post("/", response_model=RecurringPaymentResponse, status_code=201)
def create(data: RecurringPaymentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_recurring_payment(db, data, current_user.id)


@router.get("/{rp_id}", response_model=RecurringPaymentResponse)
def get_one(rp_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rp = get_recurring_payment(db, rp_id, current_user.id)
    if not rp:
        raise HTTPException(status_code=404, detail="Recurring payment not found")
    return rp


@router.put("/{rp_id}", response_model=RecurringPaymentResponse)
def update(rp_id: int, data: RecurringPaymentUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Update a recurring payment.
    Set status='inactive' to pause it, status='active' to resume.
    """
    rp = get_recurring_payment(db, rp_id, current_user.id)
    if not rp:
        raise HTTPException(status_code=404, detail="Recurring payment not found")
    return update_recurring_payment(db, rp, data)


@router.delete("/{rp_id}", status_code=204)
def delete(rp_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rp = get_recurring_payment(db, rp_id, current_user.id)
    if not rp:
        raise HTTPException(status_code=404, detail="Recurring payment not found")
    delete_recurring_payment(db, rp)