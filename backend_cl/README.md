# Expense Tracker API

Node.js + Express + MySQL backend with JWT authentication.

---

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
mysql -u root -p < sql/schema.sql
npm run dev
```

---

## Authentication

All routes (except `/api/auth/*`) require a Bearer token:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Auth
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password, phone? }` | Register new user |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns token |

---

### Users
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | — | Get own profile |
| PUT | `/api/users/me` | `{ name?, phone? }` | Update profile |
| PUT | `/api/users/me/password` | `{ current_password, new_password }` | Change password |

---

### Accounts
| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/api/accounts` | — | List all accounts |
| GET | `/api/accounts/:id` | — | Get account |
| POST | `/api/accounts` | `{ account_name, account_type, balance? }` | Create account |
| PUT | `/api/accounts/:id` | `{ account_name?, account_type?, balance? }` | Update account |
| DELETE | `/api/accounts/:id` | — | Delete account |

---

### Expenses
| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/api/expenses` | `?account_id&category_id&payment_method_id&from&to&tag_id` | List expenses |
| GET | `/api/expenses/:id` | — | Get expense (includes tags + notes) |
| POST | `/api/expenses` | `{ account_id, category_id, payment_method_id, amount, date, description?, tag_ids? }` | Create expense (deducts from account balance) |
| PUT | `/api/expenses/:id` | `{ category_id?, payment_method_id?, amount?, date?, description? }` | Update expense |
| DELETE | `/api/expenses/:id` | — | Delete expense (restores balance) |
| POST | `/api/expenses/:id/notes` | `{ note_text }` | Add note to expense |
| POST | `/api/expenses/:id/tags` | `{ tag_id }` | Add tag to expense |
| DELETE | `/api/expenses/:id/tags/:tag_id` | — | Remove tag from expense |

---

### Income
| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/api/income` | `?account_id&from&to` | List income records |
| GET | `/api/income/:id` | — | Get income record |
| POST | `/api/income` | `{ account_id, amount, date, source?, description? }` | Record income (adds to account balance) |
| PUT | `/api/income/:id` | `{ amount?, date?, source?, description? }` | Update income |
| DELETE | `/api/income/:id` | — | Delete income (deducts balance) |

---

### Budgets
| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/api/budgets` | `?month&year` | List budgets (includes `spent` for that month) |
| GET | `/api/budgets/:id` | — | Get budget |
| POST | `/api/budgets` | `{ category_id, amount, month, year }` | Create budget |
| PUT | `/api/budgets/:id` | `{ amount }` | Update budget amount |
| DELETE | `/api/budgets/:id` | — | Delete budget |

---

### Categories
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/categories` | — | List all categories |
| POST | `/api/categories` | `{ category_name }` | Create category |
| DELETE | `/api/categories/:id` | — | Delete category |

---

### Payment Methods
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/payment-methods` | — | List all payment methods |
| POST | `/api/payment-methods` | `{ method_name }` | Create payment method |
| DELETE | `/api/payment-methods/:id` | — | Delete payment method |

---

### Recurring Payments
| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/api/recurring` | `?status` | List recurring payments |
| GET | `/api/recurring/:id` | — | Get recurring payment |
| POST | `/api/recurring` | `{ account_id, category_id, payment_method_id, amount, frequency, start_date, end_date?, status? }` | Create recurring payment |
| PUT | `/api/recurring/:id` | `{ amount?, frequency?, end_date?, status? }` | Update recurring payment |
| DELETE | `/api/recurring/:id` | — | Delete recurring payment |

`frequency`: `daily` \| `weekly` \| `monthly` \| `yearly`  
`status`: `active` \| `paused` \| `cancelled`

---

### Savings Goals
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/savings-goals` | — | List all savings goals |
| GET | `/api/savings-goals/:id` | — | Get savings goal |
| POST | `/api/savings-goals` | `{ account_id, goal_name, target_amount, saved_amount?, deadline? }` | Create savings goal |
| PUT | `/api/savings-goals/:id` | `{ goal_name?, target_amount?, saved_amount?, deadline? }` | Update goal (use `saved_amount` to track progress) |
| DELETE | `/api/savings-goals/:id` | — | Delete savings goal |

---

### Reminders
| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/api/reminders` | `?status` | List reminders |
| GET | `/api/reminders/:id` | — | Get reminder |
| POST | `/api/reminders` | `{ reminder_type, reminder_date, description?, status? }` | Create reminder |
| PUT | `/api/reminders/:id` | `{ reminder_type?, reminder_date?, description?, status? }` | Update reminder |
| DELETE | `/api/reminders/:id` | — | Delete reminder |

`status`: `pending` \| `done` \| `dismissed`

---

### Persons (Loan Contacts)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/persons` | — | List all persons |
| GET | `/api/persons/:id` | — | Get person |
| POST | `/api/persons` | `{ person_name, phone?, email?, notes? }` | Create person |
| PUT | `/api/persons/:id` | `{ person_name?, phone?, email?, notes? }` | Update person |
| DELETE | `/api/persons/:id` | — | Delete person |

---

### Loans
| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/api/loans` | `?loan_type&status&person_id` | List loans |
| GET | `/api/loans/:id` | — | Get loan |
| POST | `/api/loans` | `{ person_id, loan_type, amount, given_date, due_date?, description?, status? }` | Create loan |
| PUT | `/api/loans/:id` | `{ amount?, due_date?, description?, status? }` | Update loan |
| DELETE | `/api/loans/:id` | — | Delete loan |

`loan_type`: `given` \| `received`  
`status`: `pending` \| `settled` \| `overdue`

---

### Tags
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/tags` | — | List all tags |
| POST | `/api/tags` | `{ tag_name }` | Create tag |
| DELETE | `/api/tags/:id` | — | Delete tag |

---

## Design Decisions

- **Balance sync** — creating/deleting an expense or income record automatically adjusts the linked account's balance inside a transaction, keeping it consistent.
- **Ownership enforcement** — all user-scoped resources are filtered by `user_id` from the JWT payload. You can never read or mutate another user's data.
- **Budget `spent` field** — the `GET /api/budgets` response includes a live `spent` subquery so the frontend can render progress bars without a separate call.
- **Expense detail** — `GET /api/expenses/:id` returns the full record with joined tags and notes in a single response.
- **Transactions** — any write that touches both a child table and `ACCOUNT.balance` is wrapped in a MySQL transaction with rollback on failure.
