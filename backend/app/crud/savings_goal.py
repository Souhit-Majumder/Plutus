from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.savings_goal import SavingsGoal
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate


def get_savings_goals(db: Session, user_id: int) -> List[SavingsGoal]:
    return db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()


def get_savings_goal(db: Session, goal_id: int, user_id: int) -> Optional[SavingsGoal]:
    return db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id
    ).first()


def create_savings_goal(db: Session, data: SavingsGoalCreate, user_id: int) -> SavingsGoal:
    goal = SavingsGoal(user_id=user_id, saved_amount=Decimal("0.00"), **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_savings_goal(db: Session, goal: SavingsGoal, data: SavingsGoalUpdate) -> SavingsGoal:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


def add_funds_to_goal(db: Session, goal: SavingsGoal, amount: Decimal) -> SavingsGoal:
    """
    Add money toward a savings goal.
    saved_amount accumulates; remaining = target - saved (computed in the schema).
    We cap saved_amount at target_amount so it never exceeds the goal.
    """
    current = Decimal(str(goal.saved_amount))
    target  = Decimal(str(goal.target_amount))
    new_saved = min(current + amount, target)   # cap at target
    goal.saved_amount = new_saved
    db.commit()
    db.refresh(goal)
    return goal


def delete_savings_goal(db: Session, goal: SavingsGoal):
    db.delete(goal)
    db.commit()
