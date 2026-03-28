const db = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM PAYMENT_METHOD ORDER BY method_name');
    res.json(rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { method_name } = req.body;
    if (!method_name) return res.status(400).json({ message: 'method_name is required' });
    const [result] = await db.query('INSERT INTO PAYMENT_METHOD (method_name) VALUES (?)', [method_name]);
    res.status(201).json({ payment_method_id: result.insertId, message: 'Payment method created' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM PAYMENT_METHOD WHERE payment_method_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment method not found' });
    res.json({ message: 'Payment method deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, remove };
