# ─────────────────────────────────────────────────────────────────────────────
# models/__init__.py
#
# Importing all models here ensures SQLAlchemy (and Alembic) discovers every
# table when it scans the Base metadata.
#
# If you add a new model file, import it here too.
# ─────────────────────────────────────────────────────────────────────────────

from app.models.user import User
from app.models.account import Account
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.models.expense import Expense, ExpenseTag
from app.models.income import Income
from app.models.recurring_payment import RecurringPayment
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal
from app.models.tag import Tag
from app.models.loan import Loan
from app.models.person import Person
from app.models.reminder import Reminder
from app.models.transaction_note import TransactionNote
