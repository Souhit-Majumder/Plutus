CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

-- ─────────────────────────────────────────────
-- Lookup / reference tables (no user ownership)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS CATEGORY (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS PAYMENT_METHOD (
    payment_method_id INT AUTO_INCREMENT PRIMARY KEY,
    method_name       VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS TAG (
    tag_id   INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(100) NOT NULL UNIQUE
);

-- ─────────────────────────────────────────────
-- Core user table
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS USER (
    user_id    INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    phone      VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- Account (owned by user)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ACCOUNT (
    account_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50)  NOT NULL,
    balance      DECIMAL(15,2) DEFAULT 0.00,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Budget
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS BUDGET (
    budget_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    category_id INT NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    month       TINYINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year        SMALLINT NOT NULL,
    FOREIGN KEY (user_id)     REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id),
    UNIQUE KEY uq_budget (user_id, category_id, month, year)
);

-- ─────────────────────────────────────────────
-- Recurring payment
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS RECURRING_PAYMENT (
    recurring_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    title             VARCHAR(120),
    account_id        INT NOT NULL,
    category_id       INT NOT NULL,
    payment_method_id INT NOT NULL,
    amount            DECIMAL(15,2) NOT NULL,
    frequency         ENUM('daily','weekly','monthly','yearly') NOT NULL,
    start_date        DATE NOT NULL,
    end_date          DATE,
    status            ENUM('active','paused','cancelled') DEFAULT 'active',
    FOREIGN KEY (user_id)           REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id)        REFERENCES ACCOUNT(account_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id)       REFERENCES CATEGORY(category_id),
    FOREIGN KEY (payment_method_id) REFERENCES PAYMENT_METHOD(payment_method_id)
);

-- ─────────────────────────────────────────────
-- Expense
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS EXPENSE (
    expense_id        INT AUTO_INCREMENT PRIMARY KEY,
    account_id        INT NOT NULL,
    category_id       INT NOT NULL,
    payment_method_id INT NOT NULL,
    amount            DECIMAL(15,2) NOT NULL,
    date              DATE NOT NULL,
    description       VARCHAR(500),
    recurring_id      INT DEFAULT NULL,
    FOREIGN KEY (account_id)        REFERENCES ACCOUNT(account_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id)       REFERENCES CATEGORY(category_id),
    FOREIGN KEY (payment_method_id) REFERENCES PAYMENT_METHOD(payment_method_id),
    FOREIGN KEY (recurring_id)      REFERENCES RECURRING_PAYMENT(recurring_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- Income
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS INCOME (
    income_id   INT AUTO_INCREMENT PRIMARY KEY,
    account_id  INT NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    date        DATE NOT NULL,
    source      VARCHAR(255),
    description VARCHAR(500),
    FOREIGN KEY (account_id) REFERENCES ACCOUNT(account_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Savings goal
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS SAVINGS_GOAL (
    goal_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    account_id    INT NOT NULL,
    goal_name     VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    saved_amount  DECIMAL(15,2) DEFAULT 0.00,
    deadline      DATE,
    FOREIGN KEY (user_id)    REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES ACCOUNT(account_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Transaction notes
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TRANSACTION_NOTE (
    note_id    INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    note_text  TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES EXPENSE(expense_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Expense ↔ Tag junction
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS EXPENSE_TAG (
    expense_id INT NOT NULL,
    tag_id     INT NOT NULL,
    PRIMARY KEY (expense_id, tag_id),
    FOREIGN KEY (expense_id) REFERENCES EXPENSE(expense_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)     REFERENCES TAG(tag_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Reminder
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS REMINDER (
    reminder_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    reminder_type VARCHAR(100) NOT NULL,
    reminder_date DATE NOT NULL,
    description   VARCHAR(500),
    status        ENUM('pending','done','dismissed') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Person (contact for loans)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS PERSON (
    person_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    person_name VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    email       VARCHAR(255),
    notes       TEXT,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Loan
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS LOAN (
    loan_id     INT AUTO_INCREMENT PRIMARY KEY,
    person_id   INT NOT NULL,
    loan_type   ENUM('given','received') NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    given_date  DATE NOT NULL,
    due_date    DATE,
    description VARCHAR(500),
    status      ENUM('pending','settled','overdue') DEFAULT 'pending',
    repaid_date DATE,
    FOREIGN KEY (person_id) REFERENCES PERSON(person_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- Seed data for lookup tables
-- ─────────────────────────────────────────────

INSERT IGNORE INTO CATEGORY (category_name) VALUES
    ('Food & Dining'), ('Transport'), ('Shopping'), ('Entertainment'),
    ('Health & Medical'), ('Utilities'), ('Rent'), ('Education'),
    ('Travel'), ('Subscriptions'), ('Salary'), ('Freelance'), ('Other');

INSERT IGNORE INTO PAYMENT_METHOD (method_name) VALUES
    ('Cash'), ('Credit Card'), ('Debit Card'), ('UPI'), ('Net Banking'),
    ('Wallet'), ('Cheque'), ('Bank Transfer');