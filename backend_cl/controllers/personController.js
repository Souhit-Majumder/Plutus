const db = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM PERSON WHERE user_id = ? ORDER BY person_name',
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM PERSON WHERE person_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Person not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { person_name, phone, email, notes } = req.body;
    if (!person_name) return res.status(400).json({ message: 'person_name is required' });
    const [result] = await db.query(
      'INSERT INTO PERSON (user_id, person_name, phone, email, notes) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, person_name, phone || null, email || null, notes || null]
    );
    res.status(201).json({ person_id: result.insertId, message: 'Person created' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { person_name, phone, email, notes } = req.body;
    const [result] = await db.query(
      `UPDATE PERSON
       SET person_name = COALESCE(?, person_name),
           phone = COALESCE(?, phone), email = COALESCE(?, email), notes = COALESCE(?, notes)
       WHERE person_id = ? AND user_id = ?`,
      [person_name || null, phone || null, email || null, notes || null, req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Person not found' });
    res.json({ message: 'Person updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM PERSON WHERE person_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Person not found' });
    res.json({ message: 'Person deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
