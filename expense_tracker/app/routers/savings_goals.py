from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.savings_goal import (
    add_funds_to_goal, create_savings_goal, delete_savings_goal,
    get_savings_goal, get_savings_goals, update_savings_goal
)
from app.schemas.savings_goal import (
    AddFundsRequest, SavingsGoalCreate, SavingsGoalResponse, SavingsGoalUpdate
)

router = APIRouter(prefix="/api/savings-goals", tags=["Savings Goals"])


@router.get("/", response_model=List[SavingsGoalResponse])
def list_goals(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_savings_goals(db, current_user.id)


@router.post("/", response_model=SavingsGoalResponse, status_code=201)
def create(data: SavingsGoalCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_savings_goal(db, data, current_user.id)


@router.get("/{goal_id}", response_model=SavingsGoalResponse)
def get_one(goal_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    goal = get_savings_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return goal


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update(goal_id: int, data: SavingsGoalUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    goal = get_savings_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return update_savings_goal(db, goal, data)


@router.post("/{goal_id}/add-funds", response_model=SavingsGoalResponse)
def add_funds(goal_id: int, body: AddFundsRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Add money toward a savings goal.
    saved_amount increases; remaining_amount decreases.
    saved_amount is capped at target_amount.
    """
    goal = get_savings_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return add_funds_to_goal(db, goal, body.amount)


@router.delete("/{goal_id}", status_code=204)
def delete(goal_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    goal = get_savings_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    delete_savings_goal(db, goal)
