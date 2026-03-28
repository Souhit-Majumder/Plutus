const db = require('../config/db');

// GET /api/income  ?account_id= &from= &to=
const getAll = async (req, res, next) => {
  try {
    const { account_id, from, to } = req.query;
    let sql = `
      SELECT i.*, a.account_name FROM INCOME i
      JOIN ACCOUNT a ON i.account_id = a.account_id
      WHERE a.user_id = ?
    `;
    const params = [req.user.user_id];
    if (account_id) { sql += ' AND i.account_id = ?'; params.push(account_id); }
    if (from)       { sql += ' AND i.date >= ?';       params.push(from); }
    if (to)         { sql += ' AND i.date <= ?';        params.push(to); }
    sql += ' ORDER BY i.date DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/income/:id
const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, a.account_name FROM INCOME i
       JOIN ACCOUNT a ON i.account_id = a.account_id
       WHERE i.income_id = ? AND a.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Income record not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/income
const create = async (req, res, next) => {
  try {
    const { account_id, amount, date, source, description } = req.body;
    if (!account_id || !amount || !date) {
      return res.status(400).json({ message: 'account_id, amount and date are required' });
    }
    const [acct] = await db.query(
      'SELECT account_id FROM ACCOUNT WHERE account_id = ? AND user_id = ?',
      [account_id, req.user.user_id]
    );
    if (acct.length === 0) return res.status(403).json({ message: 'Account not found or access denied' });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        'INSERT INTO INCOME (account_id, amount, date, source, description) VALUES (?, ?, ?, ?, ?)',
        [account_id, amount, date, source || null, description || null]
      );
      await conn.query('UPDATE ACCOUNT SET balance = balance + ? WHERE account_id = ?', [amount, account_id]);
      await conn.commit();
      res.status(201).json({ income_id: result.insertId, message: 'Income recorded' });
    } catch (err) {
      await conn.rollback(); throw err;
    } finally { conn.release(); }
  } catch (err) { next(err); }
};

// PUT /api/income/:id
const update = async (req, res, next) => {
  try {
    const { amount, date, source, description } = req.body;
    const [check] = await db.query(
      `SELECT i.income_id, i.amount, i.account_id FROM INCOME i
       JOIN ACCOUNT a ON i.account_id = a.account_id
       WHERE i.income_id = ? AND a.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (check.length === 0) return res.status(404).json({ message: 'Income record not found' });
    const old = check[0];

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE INCOME SET amount = COALESCE(?, amount), date = COALESCE(?, date),
         source = COALESCE(?, source), description = COALESCE(?, description)
         WHERE income_id = ?`,
        [amount ?? null, date || null, source || null, description || null, req.params.id]
      );
      if (amount !== undefined && parseFloat(amount) !== parseFloat(old.amount)) {
        const diff = parseFloat(amount) - parseFloat(old.amount);
        await conn.query('UPDATE ACCOUNT SET balance = balance + ? WHERE account_id = ?', [diff, old.account_id]);
      }
      await conn.commit();
      res.json({ message: 'Income updated' });
    } catch (err) {
      await conn.rollback(); throw err;
    } finally { conn.release(); }
  } catch (err) { next(err); }
};

// DELETE /api/income/:id
const remove = async (req, res, next) => {
  try {
    const [check] = await db.query(
      `SELECT i.income_id, i.amount, i.account_id FROM INCOME i
       JOIN ACCOUNT a ON i.account_id = a.account_id
       WHERE i.income_id = ? AND a.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (check.length === 0) return res.status(404).json({ message: 'Income record not found' });
    const { amount, account_id } = check[0];

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM INCOME WHERE income_id = ?', [req.params.id]);
      await conn.query('UPDATE ACCOUNT SET balance = balance - ? WHERE account_id = ?', [amount, account_id]);
      await conn.commit();
      res.json({ message: 'Income record deleted' });
    } catch (err) {
      await conn.rollback(); throw err;
    } finally { conn.release(); }
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
