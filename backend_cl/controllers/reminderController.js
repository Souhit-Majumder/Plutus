const db = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM REMINDER WHERE user_id = ?';
    const params = [req.user.user_id];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY reminder_date ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM REMINDER WHERE reminder_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Reminder not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { reminder_type, reminder_date, description, status } = req.body;
    if (!reminder_type || !reminder_date) {
      return res.status(400).json({ message: 'reminder_type and reminder_date are required' });
    }
    const [result] = await db.query(
      'INSERT INTO REMINDER (user_id, reminder_type, reminder_date, description, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, reminder_type, reminder_date, description || null, status || 'pending']
    );
    res.status(201).json({ reminder_id: result.insertId, message: 'Reminder created' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { reminder_type, reminder_date, description, status } = req.body;
    const [result] = await db.query(
      `UPDATE REMINDER
       SET reminder_type = COALESCE(?, reminder_type),
           reminder_date = COALESCE(?, reminder_date),
           description   = COALESCE(?, description),
           status        = COALESCE(?, status)
       WHERE reminder_id = ? AND user_id = ?`,
      [reminder_type || null, reminder_date || null, description || null, status || null, req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM REMINDER WHERE reminder_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
