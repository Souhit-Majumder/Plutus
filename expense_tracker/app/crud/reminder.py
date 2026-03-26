from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate


def get_reminders(db: Session, user_id: int) -> List[Reminder]:
    return db.query(Reminder).filter(Reminder.user_id == user_id).all()


def get_upcoming_reminders(db: Session, user_id: int) -> List[Reminder]:
    """Return pending reminders with a future or today date — sorted soonest first."""
    return (
        db.query(Reminder)
        .filter(
            Reminder.user_id == user_id,
            Reminder.status  == "pending",
            Reminder.reminder_date >= date.today(),
        )
        .order_by(Reminder.reminder_date.asc())
        .all()
    )


def get_overdue_reminders(db: Session, user_id: int) -> List[Reminder]:
    """Return pending reminders whose date has already passed."""
    return (
        db.query(Reminder)
        .filter(
            Reminder.user_id == user_id,
            Reminder.status  == "pending",
            Reminder.reminder_date < date.today(),
        )
        .order_by(Reminder.reminder_date.asc())
        .all()
    )


def get_reminder(db: Session, reminder_id: int, user_id: int) -> Optional[Reminder]:
    return db.query(Reminder).filter(
        Reminder.id == reminder_id, Reminder.user_id == user_id
    ).first()


def create_reminder(db: Session, data: ReminderCreate, user_id: int) -> Reminder:
    reminder = Reminder(user_id=user_id, status="pending", **data.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def update_reminder(db: Session, reminder: Reminder, data: ReminderUpdate) -> Reminder:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)
    db.commit()
    db.refresh(reminder)
    return reminder


def mark_reminder_completed(db: Session, reminder: Reminder) -> Reminder:
    reminder.status = "completed"
    db.commit()
    db.refresh(reminder)
    return reminder


def delete_reminder(db: Session, reminder: Reminder):
    db.delete(reminder)
    db.commit()
