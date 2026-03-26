from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetStatus


def get_budgets(db: Session, user_id: int) -> List[Budget]:
    return db.query(Budget).filter(Budget.user_id == user_id).all()


def get_budget(db: Session, budget_id: int, user_id: int) -> Optional[Budget]:
    return db.query(Budget).filter(
        Budget.id == budget_id, Budget.user_id == user_id
    ).first()


def get_budget_by_month_category(db: Session, user_id: int, month: str, category_id: int) -> Optional[Budget]:
    """Find a budget for a specific month + category combination."""
    return db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == month,
        Budget.category_id == category_id,
    ).first()


def create_budget(db: Session, data: BudgetCreate, user_id: int) -> Budget:
    budget = Budget(user_id=user_id, **data.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def update_budget(db: Session, budget: Budget, data: BudgetUpdate) -> Budget:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return budget


def delete_budget(db: Session, budget: Budget):
    db.delete(budget)
    db.commit()


def check_budget_status(db: Session, budget: Budget, user_id: int) -> BudgetStatus:
    """
    Compare actual spending (from the expense table) against the budget limit.

    HOW:
      1. Parse the month string "YYYY-MM" to get year and month integers.
      2. Query all expenses for that user, category, and month.
      3. Sum the amounts.
      4. Calculate remaining and whether the budget is exceeded.
    """
    year, month_num = map(int, budget.month.split("-"))

    # Build a date range for the month
    from datetime import date
    import calendar
    last_day = calendar.monthrange(year, month_num)[1]
    date_from = date(year, month_num, 1)
    date_to   = date(year, month_num, last_day)

    # Sum all expenses in that category for that month
    expenses = db.query(Expense).filter(
        Expense.user_id     == user_id,
        Expense.category_id == budget.category_id,
        Expense.date        >= date_from,
        Expense.date        <= date_to,
    ).all()

    spent = sum(Decimal(str(e.amount)) for e in expenses)
    budget_amount = Decimal(str(budget.amount))
    remaining = budget_amount - spent

    return BudgetStatus(
        budget_amount = budget_amount,
        spent_amount  = spent,
        remaining     = remaining,
        exceeded      = spent > budget_amount,
    )
