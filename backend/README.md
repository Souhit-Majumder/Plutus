# 💸 Expense Tracker — FastAPI Backend

A fully-featured personal finance REST API built with **FastAPI**, **SQLAlchemy**, **MySQL**, and **JWT authentication**.

---

## ✨ Features

| Module | Endpoints |
|---|---|
| 🔐 Auth | Register, Login, Get Profile |
| 🏦 Accounts | CRUD + live balance tracking |
| 🗂️ Categories | CRUD per user |
| 💳 Payment Methods | CRUD per user |
| 💸 Expenses | CRUD + filter by category / account / tag / date range |
| 💰 Income | CRUD + auto balance credit |
| 🔁 Recurring Payments | CRUD + auto-trigger on startup |
| 📊 Budgets | Set limits per category per month + overspend check |
| 🎯 Savings Goals | CRUD + add-funds endpoint + remaining tracker |
| 🏷️ Tags | CRUD + assign/remove from expense (many-to-many) |
| 🤝 Loans | Lent / Borrowed + mark repaid |
| 👤 Persons | Contact book for loans |
| ⏰ Reminders | CRUD + upcoming + overdue endpoints |

---

## ER Diagram

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : has
    USER ||--o{ BUDGET : sets
    USER ||--o{ RECURRING_PAYMENT : creates
    USER ||--o{ SAVINGS_GOAL : sets
    USER ||--o{ REMINDER : creates
    USER ||--o{ PERSON : manages
    USER ||--o{ LOAN : owns

    ACCOUNT ||--o{ EXPENSE : records
    ACCOUNT ||--o{ INCOME : receives
    ACCOUNT ||--o{ RECURRING_PAYMENT : used_for
    ACCOUNT ||--o{ SAVINGS_GOAL : linked_to

    CATEGORY ||--o{ EXPENSE : classifies
    CATEGORY ||--o{ BUDGET : used_in
    CATEGORY ||--o{ RECURRING_PAYMENT : used_in

    PAYMENT_METHOD ||--o{ EXPENSE : paid_by
    PAYMENT_METHOD ||--o{ RECURRING_PAYMENT : paid_by

    EXPENSE ||--o{ TRANSACTION_NOTE : has
    EXPENSE ||--o{ EXPENSE_TAG : tagged_in

    TAG ||--o{ EXPENSE_TAG : used_in

    PERSON ||--o{ LOAN : involved_in

    USER {
        int user_id PK
        string name
        string email
        string password
        string phone
        datetime created_at
    }
    ACCOUNT {
        int account_id PK
        int user_id FK
        string account_name
        string account_type
        decimal balance
        datetime created_at
    }
    CATEGORY {
        int category_id PK
        string category_name
    }
    PAYMENT_METHOD {
        int payment_method_id PK
        string method_name
    }
    EXPENSE {
        int expense_id PK
        int account_id FK
        int category_id FK
        int payment_method_id FK
        decimal amount
        date date
        string description
    }
    INCOME {
        int income_id PK
        int account_id FK
        decimal amount
        date date
        string source
        string description
    }
    BUDGET {
        int budget_id PK
        int user_id FK
        int category_id FK
        decimal amount
        int month
        int year
    }
    RECURRING_PAYMENT {
        int recurring_id PK
        int user_id FK
        int account_id FK
        int category_id FK
        int payment_method_id FK
        decimal amount
        string frequency
        date start_date
        date end_date
        string status
    }
    SAVINGS_GOAL {
        int goal_id PK
        int user_id FK
        int account_id FK
        string goal_name
        decimal target_amount
        decimal saved_amount
        date deadline
    }
    TRANSACTION_NOTE {
        int note_id PK
        int expense_id FK
        string note_text
        datetime created_at
    }
    TAG {
        int tag_id PK
        string tag_name
    }
    EXPENSE_TAG {
        int expense_id FK
        int tag_id FK
    }
    REMINDER {
        int reminder_id PK
        int user_id FK
        string reminder_type
        date reminder_date
        string description
        string status
    }
    PERSON {
        int person_id PK
        int user_id FK
        string person_name
        string phone
        string email
        string notes
    }
    LOAN {
        int loan_id PK
        int user_id FK
        int person_id FK
        string loan_type
        decimal amount
        date given_date
        date due_date
        string description
        string status
    }
```

## 📁 Folder Structure

```
expense_tracker/
│
├── app/
│   ├── main.py              # FastAPI app, router registration, startup logic
│   ├── database.py          # SQLAlchemy engine + session factory
│   │
│   ├── core/
│   │   ├── config.py        # Settings from .env (pydantic-settings)
│   │   ├── security.py      # Password hashing + JWT creation/verification
│   │   └── dependencies.py  # get_db, get_current_user (FastAPI DI)
│   │
│   ├── models/              # SQLAlchemy ORM models (= database tables)
│   │   ├── user.py
│   │   ├── account.py
│   │   ├── category.py
│   │   ├── payment_method.py
│   │   ├── expense.py       # includes ExpenseTag junction table
│   │   ├── income.py
│   │   ├── recurring_payment.py
│   │   ├── budget.py
│   │   ├── savings_goal.py
│   │   ├── tag.py
│   │   ├── loan.py
│   │   ├── person.py
│   │   ├── reminder.py
│   │   └── transaction_note.py
│   │
│   ├── schemas/             # Pydantic schemas (request/response shapes)
│   │   └── *.py             # One file per entity
│   │
│   ├── crud/                # Database operations (Create/Read/Update/Delete)
│   │   └── *.py             # One file per entity
│   │
│   ├── routers/             # FastAPI route handlers (HTTP endpoints)
│   │   └── *.py             # One file per feature group
│   │
│   ├── services/
│   │   └── recurring_service.py  # Auto-generate expenses for due payments
│   │
│   └── utils/               # Shared helpers (extend as needed)
│
├── alembic/                 # Database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/            # Generated migration files go here
│
├── alembic.ini              # Alembic configuration
├── requirements.txt
├── .env.example             # Template — copy to .env and fill in values
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites

- Python 3.11+
- MySQL 8.0+ running locally (or via Docker)
- Git

### 2. Clone & install

```bash
git clone <your-repo-url>
cd expense_tracker

# Create a virtual environment (keeps dependencies isolated)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

### 3. Configure environment

```bash
# Copy the template
cp .env.example .env

# Open .env and fill in your values:
nano .env
```

Your `.env` should look like:

```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/expense_tracker
SECRET_KEY=your_super_secret_key_here   # generate with: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 4. Create the MySQL database

```sql
-- In MySQL shell or Workbench:
CREATE DATABASE expense_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run database migrations

```bash
# Generate the initial migration (inspects your models and creates SQL)
alembic revision --autogenerate -m "initial tables"

# Apply the migration to the database (creates all tables)
alembic upgrade head
```

### 6. Start the server

```bash
uvicorn app.main:app --reload
```

The API is now live at **http://localhost:8000**

---

## 📖 Using the API (Swagger UI)

1. Open **http://localhost:8000/docs** in your browser.
2. Click **POST /api/auth/register** → register a new user.
3. Click **POST /api/auth/login** → enter your email (as `username`) and password → copy the `access_token`.
4. Click **🔒 Authorize** (top right) → paste the token → click Authorize.
5. All protected endpoints are now unlocked — explore freely!

---

## 🔑 Authentication Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/register      │
  │  { name, email, password }    │
  │──────────────────────────────▶│  Hash password, save user
  │◀──────────────────────────────│  Return user (no password)
  │                               │
  │  POST /api/auth/login         │
  │  { username=email, password } │
  │──────────────────────────────▶│  Verify hash, create JWT
  │◀──────────────────────────────│  Return { access_token }
  │                               │
  │  GET /api/expenses            │
  │  Authorization: Bearer <token>│
  │──────────────────────────────▶│  Decode JWT, find user, return data
  │◀──────────────────────────────│  Return expenses[]
```

---

## 🔄 Key Business Logic

### Account Balance
- **Expense created** → account balance **decreases**
- **Expense deleted** → account balance **increases** (refund)
- **Expense updated** → old amount refunded, new amount deducted
- **Income created** → account balance **increases**
- **Income deleted** → account balance **decreases**

### Recurring Payments
On every server startup, the app automatically checks all active recurring payments and generates expenses for any that are due. No separate scheduler is needed.

### Budget Overspend Check
`GET /api/budgets/{id}/status` queries all expenses in the budget's category and month, sums them, and compares against the limit — returning `exceeded: true/false`.

### Many-to-Many Tags
Expenses and Tags are linked via an `expense_tag` junction table. SQLAlchemy manages this automatically — you just work with `expense.tags` as a list.

---

## 🌐 API Endpoints Summary

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login → get token |
| GET | `/api/auth/me` | Get current user |

### Expenses (with filters)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/expenses?category_id=1&date_from=2024-01-01` | List with filters |
| POST | `/api/expenses` | Create + deduct balance |
| PUT | `/api/expenses/{id}` | Update + adjust balance |
| DELETE | `/api/expenses/{id}` | Delete + refund balance |

### Loans
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/loans?status=active` | Active loans |
| GET | `/api/loans?status=repaid` | Repaid loans |
| POST | `/api/loans/{id}/repay` | Mark repaid |

### Reminders
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/reminders/upcoming` | Future pending reminders |
| GET | `/api/reminders/overdue` | Past-due pending reminders |
| POST | `/api/reminders/{id}/complete` | Mark completed |

---

## 🛠️ Development Tips

```bash
# Reset and re-run all migrations from scratch
alembic downgrade base
alembic upgrade head

# Auto-format code
pip install black
black app/

# Run with debug logging (see all SQL)
# Uncomment echo=True in app/database.py
```

---

## 📦 Tech Stack

| Library | Purpose |
|---|---|
| FastAPI | Web framework |
| SQLAlchemy | ORM (Python ↔ MySQL) |
| Alembic | Database migrations |
| PyMySQL | MySQL driver |
| Pydantic v2 | Request/response validation |
| python-jose | JWT encoding/decoding |
| passlib[bcrypt] | Password hashing |
| pydantic-settings | .env config loading |
| uvicorn | ASGI server |
