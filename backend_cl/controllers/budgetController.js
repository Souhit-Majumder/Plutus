const db = require('../config/db');

// GET /api/budgets  ?month= &year=
// Also returns how much was spent in that month per category
const getAll = async (req, res, next) => {
  console.log("Budget Request for User ID:", req.user.user_id);
  try {
    const { month, year } = req.query;
    let sql = `
      SELECT b.*, c.category_name,
        COALESCE((
          SELECT SUM(e.amount)
          FROM EXPENSE e
          JOIN ACCOUNT a ON e.account_id = a.account_id
          WHERE a.user_id = b.user_id
            AND e.category_id = b.category_id
            AND MONTH(e.date) = b.month
            AND YEAR(e.date) = b.year
        ), 0) AS spent
      FROM BUDGET b
      JOIN CATEGORY c ON b.category_id = c.category_id
      WHERE b.user_id = ?
    `;
    const params = [req.user.user_id];
    if (month) { sql += ' AND b.month = ?'; params.push(month); }
    if (year)  { sql += ' AND b.year = ?';  params.push(year); }
    sql += ' ORDER BY b.year DESC, b.month DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/budgets/:id
const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, c.category_name FROM BUDGET b
       JOIN CATEGORY c ON b.category_id = c.category_id
       WHERE b.budget_id = ? AND b.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Budget not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/budgets
const create = async (req, res, next) => {
  try {
    const { category_id, amount, month, year } = req.body;
    if (!category_id || !amount || !month || !year) {
      return res.status(400).json({ message: 'category_id, amount, month and year are required' });
    }
    const [result] = await db.query(
      'INSERT INTO BUDGET (user_id, category_id, amount, month, year) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, category_id, amount, month, year]
    );
    res.status(201).json({ budget_id: result.insertId, message: 'Budget created' });
  } catch (err) { next(err); }
};

// PUT /api/budgets/:id
const update = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const [result] = await db.query(
      'UPDATE BUDGET SET amount = COALESCE(?, amount) WHERE budget_id = ? AND user_id = ?',
      [amount ?? null, req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget updated' });
  } catch (err) { next(err); }
};

// DELETE /api/budgets/:id
const remove = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM BUDGET WHERE budget_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
