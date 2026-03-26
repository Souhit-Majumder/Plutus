from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.payment_method import PaymentMethod
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate


def get_payment_methods(db: Session, user_id: int) -> List[PaymentMethod]:
    return db.query(PaymentMethod).filter(PaymentMethod.user_id == user_id).all()


def get_payment_method(db: Session, pm_id: int, user_id: int) -> Optional[PaymentMethod]:
    return db.query(PaymentMethod).filter(
        PaymentMethod.id == pm_id, PaymentMethod.user_id == user_id
    ).first()


def create_payment_method(db: Session, data: PaymentMethodCreate, user_id: int) -> PaymentMethod:
    pm = PaymentMethod(user_id=user_id, **data.model_dump())
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return pm


def update_payment_method(db: Session, pm: PaymentMethod, data: PaymentMethodUpdate) -> PaymentMethod:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pm, field, value)
    db.commit()
    db.refresh(pm)
    return pm


def delete_payment_method(db: Session, pm: PaymentMethod):
    db.delete(pm)
    db.commit()
