# ─────────────────────────────────────────────────────────────────────────────
# app/main.py
#
# This is the entry point of the FastAPI application.
#
# WHAT HAPPENS WHEN THE SERVER STARTS:
#   1. FastAPI app is created.
#   2. All routers are registered (each router = a group of related endpoints).
#   3. The lifespan function runs on startup:
#      a. Triggers due recurring payments.
#   4. Uvicorn starts serving requests on http://localhost:8000
#
# SWAGGER UI (auto-generated docs):
#   http://localhost:8000/docs        ← interactive API explorer
#   http://localhost:8000/redoc       ← alternative docs view
# ─────────────────────────────────────────────────────────────────────────────

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import SessionLocal

# ── Import all routers ────────────────────────────────────────────────────────
from app.routers import (
    auth,
    accounts,
    categories,
    payment_methods,
    expenses,
    income,
    recurring_payments,
    budgets,
    savings_goals,
    tags,
    persons,
    loans,
    reminders,
)

# ── Startup logic (lifespan) ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Code inside 'yield' runs at startup; after yield runs at shutdown.
    We use this to trigger recurring payments when the server boots.
    """
    print(f"🚀 Starting {settings.APP_NAME}...")

    # Open a temporary DB session just for startup tasks
    db = SessionLocal()
    try:
        from app.services.recurring_service import trigger_due_recurring_payments
        trigger_due_recurring_payments(db)
    finally:
        db.close()

    yield  # ← App is running between here

    print("👋 Shutting down...")


# ── Create FastAPI app ────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="""
## Expense Tracker API

A fully-featured personal finance backend with:
- 🔐 JWT Authentication
- 💰 Multi-account balance tracking
- 📊 Expense & Income management with filters
- 🔁 Recurring payment auto-generation
- 📅 Budget tracking with overspend alerts
- 🎯 Savings goals
- 🏷️ Tag system (many-to-many)
- 🤝 Loan tracking (lent/borrowed)
- ⏰ Reminders (upcoming & overdue)

**To get started:** Register → Login → Copy the token → Click Authorize (🔒) → Explore!
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS middleware ───────────────────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing.
# Allows a frontend (e.g. React on port 3000) to call this API (port 8000).
# In production, replace "*" with your frontend's actual domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Change to ["https://yourfrontend.com"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────────────────────────────
# Each router handles a group of related endpoints.
# The 'prefix' is set inside each router file itself.
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(categories.router)
app.include_router(payment_methods.router)
app.include_router(expenses.router)
app.include_router(income.router)
app.include_router(recurring_payments.router)
app.include_router(budgets.router)
app.include_router(savings_goals.router)
app.include_router(tags.router)
app.include_router(persons.router)
app.include_router(loans.router)
app.include_router(reminders.router)


# ── Root health-check endpoint ────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    """Simple health check — confirms the API is running."""
    return {"status": "ok", "app": settings.APP_NAME, "docs": "/docs"}
