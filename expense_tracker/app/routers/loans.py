from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.loan import create_loan, delete_loan, get_loan, get_loans, mark_loan_repaid, update_loan
from app.schemas.loan import LoanCreate, LoanResponse, LoanUpdate

router = APIRouter(prefix="/api/loans", tags=["Loans"])


@router.get("/", response_model=List[LoanResponse])
def list_loans(
    status: Optional[str] = Query(None, description="Filter: 'active' or 'repaid'"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get all loans. Optionally filter by status.
    - GET /api/loans           → all loans
    - GET /api/loans?status=active  → only active loans
    - GET /api/loans?status=repaid  → only completed loans
    """
    return get_loans(db, current_user.id, status=status)


@router.post("/", response_model=LoanResponse, status_code=201)
def create(data: LoanCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Create a loan.
    loan_type = 'lent'     → you gave money to someone (they owe you)
    loan_type = 'borrowed' → you received money (you owe them)
    """
    return create_loan(db, data, current_user.id)


@router.get("/{loan_id}", response_model=LoanResponse)
def get_one(loan_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loan = get_loan(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.put("/{loan_id}", response_model=LoanResponse)
def update(loan_id: int, data: LoanUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loan = get_loan(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return update_loan(db, loan, data)


@router.post("/{loan_id}/repay", response_model=LoanResponse)
def repay(loan_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Mark a loan as fully repaid. Sets status='repaid' and records repaid_date."""
    loan = get_loan(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.status == "repaid":
        raise HTTPException(status_code=400, detail="Loan already marked as repaid")
    return mark_loan_repaid(db, loan)


@router.delete("/{loan_id}", status_code=204)
def delete(loan_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loan = get_loan(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    delete_loan(db, loan)
