const db = require('../config/db');

// GET /api/tags  — global lookup
const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM TAG ORDER BY tag_name');
    res.json(rows);
  } catch (err) { next(err); }
};

// POST /api/tags
const create = async (req, res, next) => {
  try {
    const { tag_name } = req.body;
    if (!tag_name) return res.status(400).json({ message: 'tag_name is required' });
    const [result] = await db.query('INSERT INTO TAG (tag_name) VALUES (?)', [tag_name]);
    res.status(201).json({ tag_id: result.insertId, message: 'Tag created' });
  } catch (err) { next(err); }
};

// DELETE /api/tags/:id
const remove = async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM TAG WHERE tag_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Tag not found' });
    res.json({ message: 'Tag deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, remove };
