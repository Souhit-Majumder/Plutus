// ─── Axios API Service Layer ───────────────────────────────────────────────
// All API calls flow through this file.
// JWT token is automatically attached to every request via interceptors.


import axios from 'axios'
// api.js
console.log("Current API URL:", import.meta.env.VITE_API_BASE_URL);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: handle 401 globally ────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (email, password) => {
    return api.post('/api/auth/login', { email, password });
  },
  me: () => api.get('/api/users/me'),
}

// ── Accounts ──────────────────────────────────────────────────────────────
export const accountService = {
  list: () => api.get('/api/accounts/'),
  get: (id) => api.get(`/api/accounts/${id}`),
  create: (data) => api.post('/api/accounts/', data),
  update: (id, data) => api.put(`/api/accounts/${id}`, data),
  delete: (id) => api.delete(`/api/accounts/${id}`),
  monthlySummary: (month, year) => api.get('/api/accounts/monthly-summary', { params: { month, year } }),
}

// ── Categories ────────────────────────────────────────────────────────────
export const categoryService = {
  list: () => api.get('/api/categories/'),
  create: (data) => api.post('/api/categories/', data),
  update: (id, data) => api.put(`/api/categories/${id}`, data),
  delete: (id) => api.delete(`/api/categories/${id}`),
}

// ── Payment Methods ───────────────────────────────────────────────────────
export const paymentMethodService = {
  list: () => api.get('/api/payment-methods/'),
  create: (data) => api.post('/api/payment-methods/', data),
  update: (id, data) => api.put(`/api/payment-methods/${id}`, data),
  delete: (id) => api.delete(`/api/payment-methods/${id}`),
}

// ── Tags ──────────────────────────────────────────────────────────────────
export const tagService = {
  list: () => api.get('/api/tags/'),
  create: (data) => api.post('/api/tags/', data),
  update: (id, data) => api.put(`/api/tags/${id}`, data),
  delete: (id) => api.delete(`/api/tags/${id}`),
  assignToExpense: (tagId, expenseId) => api.post(`/api/tags/${tagId}/assign/${expenseId}`),
  removeFromExpense: (tagId, expenseId) => api.delete(`/api/tags/${tagId}/remove/${expenseId}`),
}

// ── Expenses ──────────────────────────────────────────────────────────────
export const expenseService = {
  list: (params = {}) => api.get('/api/expenses/', { params }),
  get: (id) => api.get(`/api/expenses/${id}`),
  create: (data) => api.post('/api/expenses/', data),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
}

// ── Income ────────────────────────────────────────────────────────────────
export const incomeService = {
  list: () => api.get('/api/income/'),
  create: (data) => api.post('/api/income/', data),
  update: (id, data) => api.put(`/api/income/${id}`, data),
  delete: (id) => api.delete(`/api/income/${id}`),
}

// ── Budgets ───────────────────────────────────────────────────────────────
export const budgetService = {
  list: () => api.get('/api/budgets/'),
  create: (data) => api.post('/api/budgets/', data),
  update: (id, data) => api.put(`/api/budgets/${id}`, data),
  delete: (id) => api.delete(`/api/budgets/${id}`),
  status: (id) => api.get(`/api/budgets/${id}/status`),
}

// ── Savings Goals ─────────────────────────────────────────────────────────
export const savingsGoalService = {
  list: () => api.get('/api/savings-goals/'),
  create: (data) => api.post('/api/savings-goals/', data),
  update: (id, data) => api.put(`/api/savings-goals/${id}`, data),
  delete: (id) => api.delete(`/api/savings-goals/${id}`),
  addFunds: (id, amount) => api.post(`/api/savings-goals/${id}/add-funds`, { amount }),
}

// ── Loans ─────────────────────────────────────────────────────────────────
export const loanService = {
  list: (status) => api.get('/api/loans/', { params: status ? { status } : {} }),
  create: (data) => api.post('/api/loans/', data),
  update: (id, data) => api.put(`/api/loans/${id}`, data),
  repay: (id) => api.post(`/api/loans/${id}/repay`),
  delete: (id) => api.delete(`/api/loans/${id}`),
}

// ── Persons ───────────────────────────────────────────────────────────────
export const personService = {
  list: () => api.get('/api/persons/'),
  create: (data) => api.post('/api/persons/', data),
  update: (id, data) => api.put(`/api/persons/${id}`, data),
  delete: (id) => api.delete(`/api/persons/${id}`),
}

// ── Reminders ─────────────────────────────────────────────────────────────
export const reminderService = {
  list: () => api.get('/api/reminders/'),
  upcoming: () => api.get('/api/reminders/upcoming'),
  overdue: () => api.get('/api/reminders/overdue'),
  create: (data) => api.post('/api/reminders/', data),
  complete: (id) => api.post(`/api/reminders/${id}/complete`),
  delete: (id) => api.delete(`/api/reminders/${id}`),
}
