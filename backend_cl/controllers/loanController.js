const db = require('../config/db');

// GET /api/loans  ?loan_type= &status= &person_id=
const getAll = async (req, res, next) => {
  try {
    const { loan_type, status, person_id } = req.query;
    let sql = `
      SELECT l.*, p.person_name, p.phone AS person_phone, p.email AS person_email
      FROM LOAN l
      JOIN PERSON p ON l.person_id = p.person_id
      WHERE l.user_id = ?
    `;
    const params = [req.user.user_id];
    if (loan_type)  { sql += ' AND l.loan_type = ?';  params.push(loan_type); }
    if (status)     { sql += ' AND l.status = ?';     params.push(status); }
    if (person_id)  { sql += ' AND l.person_id = ?';  params.push(person_id); }
    sql += ' ORDER BY l.given_date DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/loans/:id
const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, p.person_name, p.phone AS person_phone, p.email AS person_email
       FROM LOAN l
       JOIN PERSON p ON l.person_id = p.person_id
       WHERE l.loan_id = ? AND l.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Loan not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/loans
const create = async (req, res, next) => {
  try {
    const { person_id, loan_type, amount, given_date, due_date, description, status } = req.body;
    if (!person_id || !loan_type || !amount || !given_date) {
      return res.status(400).json({ message: 'person_id, loan_type, amount and given_date are required' });
    }
    // Verify person belongs to user
    const [person] = await db.query(
      'SELECT person_id FROM PERSON WHERE person_id = ? AND user_id = ?',
      [person_id, req.user.user_id]
    );
    if (person.length === 0) return res.status(403).json({ message: 'Person not found or access denied' });
    
    const loanStatus = status ? status : 'active';
    const [result] = await db.query(
      `INSERT INTO LOAN (user_id, person_id, loan_type, amount, given_date, due_date, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, person_id, loan_type, amount, given_date, due_date || null, description || null, loanStatus]
    );
    res.status(201).json({ loan_id: result.insertId, message: 'Loan created' });
  } catch (err) { next(err); }
};

// PUT /api/loans/:id
const update = async (req, res, next) => {
  try {
    const { amount, due_date, description, status } = req.body;
    const [result] = await db.query(
      `UPDATE LOAN
       SET amount      = COALESCE(?, amount),
           due_date    = COALESCE(?, due_date),
           description = COALESCE(?, description),
           status      = COALESCE(?, status)
       WHERE loan_id = ? AND user_id = ?`,
      [amount ?? null, due_date || null, description || null, status || null, req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Loan not found' });
    res.json({ message: 'Loan updated' });
  } catch (err) { next(err); }
};

// POST /api/loans/:id/repay
const repay = async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE LOAN
       SET status = 'repaid',
           repaid_date = CURDATE()
       WHERE loan_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Loan not found' });

    res.json({ message: 'Loan marked as repaid' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/loans/:id
const remove = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM LOAN WHERE loan_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Loan not found' });
    res.json({ message: 'Loan deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, repay, remove };
