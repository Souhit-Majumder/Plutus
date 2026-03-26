from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.recurring_payment import RecurringPayment
from app.schemas.recurring_payment import RecurringPaymentCreate, RecurringPaymentUpdate


def get_recurring_payments(db: Session, user_id: int) -> List[RecurringPayment]:
    return db.query(RecurringPayment).filter(RecurringPayment.user_id == user_id).all()


def get_recurring_payment(db: Session, rp_id: int, user_id: int) -> Optional[RecurringPayment]:
    return db.query(RecurringPayment).filter(
        RecurringPayment.id == rp_id, RecurringPayment.user_id == user_id
    ).first()


def get_active_recurring_payments(db: Session) -> List[RecurringPayment]:
    """Return ALL active recurring payments across all users — used by the startup trigger."""
    return db.query(RecurringPayment).filter(RecurringPayment.status == "active").all()


def create_recurring_payment(db: Session, data: RecurringPaymentCreate, user_id: int) -> RecurringPayment:
    rp = RecurringPayment(user_id=user_id, **data.model_dump())
    db.add(rp)
    db.commit()
    db.refresh(rp)
    return rp


def update_recurring_payment(db: Session, rp: RecurringPayment, data: RecurringPaymentUpdate) -> RecurringPayment:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rp, field, value)
    db.commit()
    db.refresh(rp)
    return rp


def delete_recurring_payment(db: Session, rp: RecurringPayment):
    db.delete(rp)
    db.commit()
