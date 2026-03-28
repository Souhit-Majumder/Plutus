const db = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT r.*, c.category_name, pm.method_name, a.account_name
      FROM RECURRING_PAYMENT r
      JOIN CATEGORY c       ON r.category_id = c.category_id
      JOIN PAYMENT_METHOD pm ON r.payment_method_id = pm.payment_method_id
      JOIN ACCOUNT a         ON r.account_id = a.account_id
      WHERE r.user_id = ?
    `;
    const params = [req.user.user_id];
    if (status) { sql += ' AND r.status = ?'; params.push(status); }
    sql += ' ORDER BY r.start_date DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, c.category_name, pm.method_name, a.account_name
       FROM RECURRING_PAYMENT r
       JOIN CATEGORY c       ON r.category_id = c.category_id
       JOIN PAYMENT_METHOD pm ON r.payment_method_id = pm.payment_method_id
       JOIN ACCOUNT a         ON r.account_id = a.account_id
       WHERE r.recurring_id = ? AND r.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Recurring payment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { title, account_id, category_id, payment_method_id, amount, frequency, start_date, end_date, status } = req.body;
    if (!account_id || !category_id || !payment_method_id || !amount || !frequency || !start_date) {
      return res.status(400).json({ message: 'account_id, category_id, payment_method_id, amount, frequency and start_date are required' });
    }
    const [result] = await db.query(
      `INSERT INTO RECURRING_PAYMENT
       (user_id, title, account_id, category_id, payment_method_id, amount, frequency, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, title || null, account_id, category_id, payment_method_id, amount, frequency, start_date, end_date || null, status || 'active']
    );
    res.status(201).json({ recurring_id: result.insertId, message: 'Recurring payment created' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { amount, frequency, end_date, status } = req.body;
    const [result] = await db.query(
      `UPDATE RECURRING_PAYMENT
       SET amount    = COALESCE(?, amount),
           frequency = COALESCE(?, frequency),
           end_date  = COALESCE(?, end_date),
           status    = COALESCE(?, status)
       WHERE recurring_id = ? AND user_id = ?`,
      [amount ?? null, frequency || null, end_date || null, status || null, req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Recurring payment not found' });
    res.json({ message: 'Recurring payment updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM RECURRING_PAYMENT WHERE recurring_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Recurring payment not found' });
    res.json({ message: 'Recurring payment deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
