# ─────────────────────────────────────────────────────────────────────────────
# services/recurring_service.py
#
# This service auto-generates expenses for recurring payments that are due.
#
# HOW IT WORKS (no scheduler needed):
#   When the FastAPI app STARTS, main.py calls trigger_due_recurring_payments().
#   This function:
#     1. Fetches all active recurring payments from the DB.
#     2. For each one, checks if it is "due" based on frequency and last_triggered.
#     3. If due → creates an Expense record and updates account balance.
#     4. Updates last_triggered to today so it won't fire again until next period.
#
# FREQUENCY LOGIC:
#   daily   → due if last_triggered < today
#   weekly  → due if last_triggered < today - 7 days
#   monthly → due if last_triggered month < today month
#   yearly  → due if last_triggered year < today year
#
# LIMITATIONS:
#   This approach fires on every restart.  In production you'd use a proper
#   scheduler (APScheduler, Celery Beat, or a cron job).  But for a beginner
#   project this approach is simple and works well.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.crud.account import add_balance, deduct_balance, get_account
from app.crud.recurring_payment import get_active_recurring_payments
from app.models.expense import Expense


def _is_due(rp, today: date) -> bool:
    """
    Determine if a recurring payment should fire today.

    If last_triggered is None, the payment has never fired → it's due on start_date.
    """
    last = rp.last_triggered

    # Never triggered before: due if today >= start_date
    if last is None:
        return today >= rp.start_date

    # Respect end_date: if past end date, never fire again
    if rp.end_date and today > rp.end_date:
        return False

    freq = rp.frequency.lower()

    if freq == "daily":
        return last < today

    if freq == "weekly":
        return last <= today - timedelta(weeks=1)

    if freq == "monthly":
        # Due if we're in a new month compared to last trigger
        return (today.year, today.month) > (last.year, last.month)

    if freq == "yearly":
        return today.year > last.year

    return False


def trigger_due_recurring_payments(db: Session):
    """
    Called once at app startup.
    Scans all active recurring payments and creates expenses for any that are due.

    This is a simple alternative to a background scheduler.
    In production, run this in a scheduled task (e.g. cron every midnight).
    """
    today     = date.today()
    payments  = get_active_recurring_payments(db)
    triggered = 0

    for rp in payments:
        if not _is_due(rp, today):
            continue

        # Create the expense record
        expense = Expense(
            user_id           = rp.user_id,
            account_id        = rp.account_id,
            category_id       = rp.category_id,
            payment_method_id = rp.payment_method_id,
            amount            = rp.amount,
            date              = today,
            description       = f"Auto: recurring payment #{rp.id} ({rp.frequency})",
        )
        db.add(expense)
        db.flush()

        # Deduct balance from account
        account = db.query(
            __import__("app.models.account", fromlist=["Account"]).Account
        ).filter_by(id=rp.account_id).first()

        if account:
            from decimal import Decimal
            account.balance = Decimal(str(account.balance)) - Decimal(str(rp.amount))

        # Update last_triggered so this payment doesn't fire again until next period
        rp.last_triggered = today
        triggered += 1

    if triggered:
        db.commit()

    print(f"[Recurring] Triggered {triggered} payment(s) on startup.")
