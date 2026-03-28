const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/users/me
const getProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, phone, created_at FROM USER WHERE user_id = ?',
      [req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/me
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    await db.query(
      'UPDATE USER SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE user_id = ?',
      [name || null, phone || null, req.user.user_id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/me/password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'current_password and new_password are required' });
    }

    const [rows] = await db.query('SELECT password FROM USER WHERE user_id = ?', [req.user.user_id]);
    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE USER SET password = ? WHERE user_id = ?', [hashed, req.user.user_id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
