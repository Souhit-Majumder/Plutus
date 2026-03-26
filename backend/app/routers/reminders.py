from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.crud.reminder import (
    create_reminder, delete_reminder, get_reminder, get_reminders,
    get_upcoming_reminders, get_overdue_reminders,
    mark_reminder_completed, update_reminder
)
from app.schemas.reminder import ReminderCreate, ReminderResponse, ReminderUpdate

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])


@router.get("/", response_model=List[ReminderResponse])
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_reminders(db, current_user.id)


@router.get("/upcoming", response_model=List[ReminderResponse])
def upcoming(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Return pending reminders with today's date or a future date, sorted soonest first."""
    return get_upcoming_reminders(db, current_user.id)


@router.get("/overdue", response_model=List[ReminderResponse])
def overdue(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Return pending reminders whose date has already passed."""
    return get_overdue_reminders(db, current_user.id)


@router.post("/", response_model=ReminderResponse, status_code=201)
def create(data: ReminderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_reminder(db, data, current_user.id)


@router.get("/{reminder_id}", response_model=ReminderResponse)
def get_one(reminder_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    reminder = get_reminder(db, reminder_id, current_user.id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update(reminder_id: int, data: ReminderUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    reminder = get_reminder(db, reminder_id, current_user.id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return update_reminder(db, reminder, data)


@router.post("/{reminder_id}/complete", response_model=ReminderResponse)
def complete(reminder_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Mark a reminder as completed."""
    reminder = get_reminder(db, reminder_id, current_user.id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return mark_reminder_completed(db, reminder)


@router.delete("/{reminder_id}", status_code=204)
def delete(reminder_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    reminder = get_reminder(db, reminder_id, current_user.id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    delete_reminder(db, reminder)
