# 💸 Plutus — React Frontend

A production-quality expense tracker frontend built with **React + Vite + Tailwind CSS**.
Connects to the FastAPI backend via Axios with JWT authentication.

---

## 🖼️ Pages

| Route | Page | Features |
|---|---|---|
| `/login` | Login | JWT auth, error handling |
| `/register` | Register | User creation |
| `/` | Dashboard | Stats, line chart, bar chart, donut, savings goals, recent expenses |
| `/expenses` | Expenses | Table, filters (category/account/tag/date), add/edit/delete modals |
| `/accounts` | Accounts | Card grid, balance display, add/edit/delete |
| `/loans` | Loans | Lent / Borrowed / Completed tabs, mark repaid |
| `/manage` | Manage Data | Categories · Tags · Payment Methods CRUD |

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+
- The FastAPI backend running on `http://localhost:8000`

### 2. Install & run

```bash
cd expense_frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env if your backend runs on a different port

# Start dev server
npm run dev
```

App opens at **http://localhost:5173**

### 3. Environment variables

`.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Build for production

```bash
npm run build
# Output is in dist/
```

---

## 🗂️ Folder Structure

```
src/
├── App.jsx                  # Routes + AuthProvider wrapper
├── main.jsx                 # React entry point
├── index.css                # Tailwind + global design tokens
│
├── services/
│   └── api.js               # Axios instance + all 10 API service modules
│                            # JWT auto-attached via request interceptor
│
├── hooks/
│   ├── useAuth.js           # AuthContext: login, register, logout, user state
│   └── useFetch.js          # Generic data-fetching hook with loading/error
│
├── layouts/
│   ├── Sidebar.jsx          # Compact left nav with active state animation
│   └── AppLayout.jsx        # Shell: sidebar + scrollable main area + auth guard
│
├── components/
│   ├── StatCard.jsx         # Animated KPI card (icon + value + trend)
│   ├── Modal.jsx            # Reusable modal with backdrop + Escape key
│   ├── PageHeader.jsx       # Title + subtitle + action button slot
│   ├── EmptyState.jsx       # Centered empty illustration
│   └── ui.jsx               # Spinner, Badge, ErrorBox, ConfirmRow
│
├── charts/
│   ├── LineChart.jsx        # Monthly cash flow (Recharts)
│   ├── BarChart.jsx         # Category spending (Recharts)
│   └── DonutChart.jsx       # Account distribution (Recharts)
│
├── modals/
│   ├── ExpenseModal.jsx     # Add/edit expense with tag multi-select
│   ├── AccountModal.jsx     # Add/edit account
│   └── LoanModal.jsx        # Add loan with inline person creation
│
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx    # Overview with 4 stat cards + 3 charts + table
│   ├── ExpensesPage.jsx     # Full CRUD table with 5-filter panel
│   ├── AccountsPage.jsx     # Card grid with type icons
│   ├── LoansPage.jsx        # 3-tab layout: lent / borrowed / completed
│   └── ManageDataPage.jsx   # 3-tab CRUD: categories / tags / payment methods
│
└── utils/
    └── cn.js                # cn(), formatCurrency(), formatDate(), COLORS
```

---

## 🔐 Auth Flow

1. User logs in → backend returns JWT `access_token`
2. Token stored in `localStorage`
3. Every Axios request auto-attaches `Authorization: Bearer <token>`
4. On 401 response → token cleared → redirect to `/login`
5. `AppLayout` guards all protected routes — unauthenticated users redirected

---

## 🎨 Design System

All design tokens are in `src/index.css` and `tailwind.config.js`:

| Token | Value |
|---|---|
| Font | DM Sans (Google Fonts) |
| Background | `#f8fafc` (slate-50) |
| Card | `#ffffff` with `shadow-card` |
| Primary | `#2563eb` (blue-600) |
| Border radius | `10px` for cards |
| Border | `border-slate-100` |

**Utility classes** defined in `index.css`:
- `.card` — white card with shadow
- `.btn-primary` — blue filled button
- `.btn-secondary` — white outlined button
- `.btn-danger` — red button
- `.input` — text input with focus ring
- `.label` — form label
- `.table-th`, `.table-td`, `.table-tr` — clean table styles

---

## 📦 Tech Stack

| Library | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| Axios | HTTP client + interceptors |
| Recharts | Line, bar, donut charts |
| Framer Motion | Subtle entry animations |
| Lucide React | Icon set |
| date-fns | Date formatting |
| clsx + tailwind-merge | Conditional class names |
