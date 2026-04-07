const db = require('../config/db');

// GET /api/accounts
const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ACCOUNT WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/accounts/:id
const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ACCOUNT WHERE account_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Account not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/accounts
const create = async (req, res, next) => {
  try {
    const { account_name, account_type, balance } = req.body;
    if (!account_name || !account_type) {
      return res.status(400).json({ message: 'account_name and account_type are required' });
    }
    const [result] = await db.query(
      'INSERT INTO ACCOUNT (user_id, account_name, account_type, balance) VALUES (?, ?, ?, ?)',
      [req.user.user_id, account_name, account_type, balance || 0]
    );
    res.status(201).json({ account_id: result.insertId, message: 'Account created' });
  } catch (err) { next(err); }
};

// PUT /api/accounts/:id
const update = async (req, res, next) => {
  try {
    const { account_name, account_type, balance } = req.body;
    const [result] = await db.query(
      `UPDATE ACCOUNT
       SET account_name = COALESCE(?, account_name),
           account_type = COALESCE(?, account_type),
           balance      = COALESCE(?, balance)
       WHERE account_id = ? AND user_id = ?`,
      [account_name || null, account_type || null, balance ?? null, req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account updated' });
  } catch (err) { next(err); }
};

// DELETE /api/accounts/:id
const remove = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM ACCOUNT WHERE account_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) { next(err); }
};

// GET /api/accounts/monthly-summary?month=4&year=2026
const getMonthlySummary = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const [results] = await db.query(
      'CALL GetUserMonthlySummary(?, ?, ?)',
      [req.user.user_id, month, year]
    );
    // CALL returns an array of result sets; first element has the rows
    res.json(results[0][0] || { total_income: 0, total_expense: 0 });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getMonthlySummary };
