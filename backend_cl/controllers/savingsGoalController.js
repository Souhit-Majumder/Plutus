const db = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT sg.*, a.account_name FROM SAVINGS_GOAL sg
       JOIN ACCOUNT a ON sg.account_id = a.account_id
       WHERE sg.user_id = ? ORDER BY sg.deadline ASC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT sg.*, a.account_name FROM SAVINGS_GOAL sg
       JOIN ACCOUNT a ON sg.account_id = a.account_id
       WHERE sg.goal_id = ? AND sg.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Savings goal not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { account_id, goal_name, target_amount, saved_amount, deadline } = req.body;
    if (!account_id || !goal_name || !target_amount) {
      return res.status(400).json({ message: 'account_id, goal_name and target_amount are required' });
    }
    const [result] = await db.query(
      `INSERT INTO SAVINGS_GOAL (user_id, account_id, goal_name, target_amount, saved_amount, deadline)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, account_id, goal_name, target_amount, saved_amount || 0, deadline || null]
    );
    res.status(201).json({ goal_id: result.insertId, message: 'Savings goal created' });
  } catch (err) { next(err); }
};

// PUT /api/savings-goals/:id  — update progress or details
const update = async (req, res, next) => {
  try {
    const { goal_name, target_amount, saved_amount, deadline } = req.body;
    const [result] = await db.query(
      `UPDATE SAVINGS_GOAL
       SET goal_name     = COALESCE(?, goal_name),
           target_amount = COALESCE(?, target_amount),
           saved_amount  = COALESCE(?, saved_amount),
           deadline      = COALESCE(?, deadline)
       WHERE goal_id = ? AND user_id = ?`,
      [goal_name || null, target_amount ?? null, saved_amount ?? null, deadline || null, req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Savings goal not found' });
    res.json({ message: 'Savings goal updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM SAVINGS_GOAL WHERE goal_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Savings goal not found' });
    res.json({ message: 'Savings goal deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
