from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.loan import Loan
from app.schemas.loan import LoanCreate, LoanUpdate


def get_loans(db: Session, user_id: int, status: Optional[str] = None) -> List[Loan]:
    query = db.query(Loan).filter(Loan.user_id == user_id)
    if status:
        query = query.filter(Loan.status == status)
    return query.all()


def get_loan(db: Session, loan_id: int, user_id: int) -> Optional[Loan]:
    return db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == user_id).first()


def create_loan(db: Session, data: LoanCreate, user_id: int) -> Loan:
    loan = Loan(user_id=user_id, status="active", **data.model_dump())
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def update_loan(db: Session, loan: Loan, data: LoanUpdate) -> Loan:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(loan, field, value)
    db.commit()
    db.refresh(loan)
    return loan


def mark_loan_repaid(db: Session, loan: Loan) -> Loan:
    """Mark a loan as fully repaid and record the repayment date."""
    loan.status      = "repaid"
    loan.repaid_date = date.today()
    db.commit()
    db.refresh(loan)
    return loan


def delete_loan(db: Session, loan: Loan):
    db.delete(loan)
    db.commit()
