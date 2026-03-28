const db = require('../config/db');

// GET /api/categories  — global lookup, no user scoping
const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM CATEGORY ORDER BY category_name');
    res.json(rows);
  } catch (err) { next(err); }
};

// POST /api/categories
const create = async (req, res, next) => {
  try {
    const { category_name } = req.body;
    if (!category_name) return res.status(400).json({ message: 'category_name is required' });
    const [result] = await db.query('INSERT INTO CATEGORY (category_name) VALUES (?)', [category_name]);
    res.status(201).json({ category_id: result.insertId, message: 'Category created' });
  } catch (err) { next(err); }
};

// DELETE /api/categories/:id
const remove = async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM CATEGORY WHERE category_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, remove };
