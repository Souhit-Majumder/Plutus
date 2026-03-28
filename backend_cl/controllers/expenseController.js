const db = require('../config/db');

// Helper: verify account ownership
const ownedAccount = async (account_id, user_id) => {
  const [rows] = await db.query(
    'SELECT account_id FROM ACCOUNT WHERE account_id = ? AND user_id = ?',
    [account_id, user_id]
  );
  return rows.length > 0;
};

// GET /api/expenses
// Query params: account_id, category_id, payment_method_id, from, to, tag_id
const getAll = async (req, res, next) => {
  try {
    const { account_id, category_id, payment_method_id, from, to, tag_id } = req.query;

    let sql = `
      SELECT e.*, c.category_name, pm.method_name, a.account_name
      FROM EXPENSE e
      JOIN ACCOUNT a  ON e.account_id = a.account_id
      JOIN CATEGORY c ON e.category_id = c.category_id
      JOIN PAYMENT_METHOD pm ON e.payment_method_id = pm.payment_method_id
      WHERE a.user_id = ?
    `;
    const params = [req.user.user_id];

    if (account_id) { sql += ' AND e.account_id = ?';         params.push(account_id); }
    if (category_id) { sql += ' AND e.category_id = ?';       params.push(category_id); }
    if (payment_method_id) { sql += ' AND e.payment_method_id = ?'; params.push(payment_method_id); }
    if (from) { sql += ' AND e.date >= ?';                    params.push(from); }
    if (to)   { sql += ' AND e.date <= ?';                    params.push(to); }
    if (tag_id) {
      sql += ' AND e.expense_id IN (SELECT expense_id FROM EXPENSE_TAG WHERE tag_id = ?)';
      params.push(tag_id);
    }

    sql += ' ORDER BY e.date DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/expenses/:id
const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, c.category_name, pm.method_name, a.account_name
       FROM EXPENSE e
       JOIN ACCOUNT a  ON e.account_id = a.account_id
       JOIN CATEGORY c ON e.category_id = c.category_id
       JOIN PAYMENT_METHOD pm ON e.payment_method_id = pm.payment_method_id
       WHERE e.expense_id = ? AND a.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Expense not found' });

    // Fetch tags
    const [tags] = await db.query(
      `SELECT t.tag_id, t.tag_name FROM TAG t
       JOIN EXPENSE_TAG et ON t.tag_id = et.tag_id
       WHERE et.expense_id = ?`,
      [req.params.id]
    );

    // Fetch notes
    const [notes] = await db.query(
      'SELECT * FROM TRANSACTION_NOTE WHERE expense_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ ...rows[0], tags, notes });
  } catch (err) { next(err); }
};

// POST /api/expenses
const create = async (req, res, next) => {
  try {
    const { account_id, category_id, payment_method_id, amount, date, description, tag_ids } = req.body;
    if (!account_id || !category_id || !payment_method_id || !amount || !date) {
      return res.status(400).json({ message: 'account_id, category_id, payment_method_id, amount and date are required' });
    }
    if (!(await ownedAccount(account_id, req.user.user_id))) {
      return res.status(403).json({ message: 'Account not found or access denied' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        'INSERT INTO EXPENSE (account_id, category_id, payment_method_id, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)',
        [account_id, category_id, payment_method_id, amount, date, description || null]
      );
      const expense_id = result.insertId;

      // Deduct from account balance
      await conn.query('UPDATE ACCOUNT SET balance = balance - ? WHERE account_id = ?', [amount, account_id]);

      // Attach tags
      if (Array.isArray(tag_ids) && tag_ids.length > 0) {
        const tagRows = tag_ids.map(tid => [expense_id, tid]);
        await conn.query('INSERT IGNORE INTO EXPENSE_TAG (expense_id, tag_id) VALUES ?', [tagRows]);
      }

      await conn.commit();
      res.status(201).json({ expense_id, message: 'Expense created' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) { next(err); }
};

// PUT /api/expenses/:id
const update = async (req, res, next) => {
  try {
    const { category_id, payment_method_id, amount, date, description } = req.body;

    // Verify ownership via JOIN
    const [check] = await db.query(
      `SELECT e.expense_id, e.amount, e.account_id FROM EXPENSE e
       JOIN ACCOUNT a ON e.account_id = a.account_id
       WHERE e.expense_id = ? AND a.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (check.length === 0) return res.status(404).json({ message: 'Expense not found' });

    const old = check[0];
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE EXPENSE
         SET category_id       = COALESCE(?, category_id),
             payment_method_id = COALESCE(?, payment_method_id),
             amount            = COALESCE(?, amount),
             date              = COALESCE(?, date),
             description       = COALESCE(?, description)
         WHERE expense_id = ?`,
        [category_id || null, payment_method_id || null, amount ?? null, date || null, description || null, req.params.id]
      );

      // Adjust balance if amount changed
      if (amount !== undefined && amount !== old.amount) {
        const diff = parseFloat(amount) - parseFloat(old.amount);
        await conn.query('UPDATE ACCOUNT SET balance = balance - ? WHERE account_id = ?', [diff, old.account_id]);
      }

      await conn.commit();
      res.json({ message: 'Expense updated' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) { next(err); }
};

// DELETE /api/expenses/:id
const remove = async (req, res, next) => {
  try {
    const [check] = await db.query(
      `SELECT e.expense_id, e.amount, e.account_id FROM EXPENSE e
       JOIN ACCOUNT a ON e.account_id = a.account_id
       WHERE e.expense_id = ? AND a.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (check.length === 0) return res.status(404).json({ message: 'Expense not found' });

    const { amount, account_id } = check[0];
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM EXPENSE WHERE expense_id = ?', [req.params.id]);
      await conn.query('UPDATE ACCOUNT SET balance = balance + ? WHERE account_id = ?', [amount, account_id]);
      await conn.commit();
      res.json({ message: 'Expense deleted' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) { next(err); }
};

// POST /api/expenses/:id/notes
const addNote = async (req, res, next) => {
  try {
    const { note_text } = req.body;
    if (!note_text) return res.status(400).json({ message: 'note_text is required' });

    // Verify ownership
    const [check] = await db.query(
      `SELECT e.expense_id FROM EXPENSE e JOIN ACCOUNT a ON e.account_id = a.account_id
       WHERE e.expense_id = ? AND a.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (check.length === 0) return res.status(404).json({ message: 'Expense not found' });

    const [result] = await db.query(
      'INSERT INTO TRANSACTION_NOTE (expense_id, note_text) VALUES (?, ?)',
      [req.params.id, note_text]
    );
    res.status(201).json({ note_id: result.insertId, message: 'Note added' });
  } catch (err) { next(err); }
};

// POST /api/expenses/:id/tags
const addTag = async (req, res, next) => {
  try {
    const { tag_id } = req.body;
    if (!tag_id) return res.status(400).json({ message: 'tag_id is required' });

    const [check] = await db.query(
      `SELECT e.expense_id FROM EXPENSE e JOIN ACCOUNT a ON e.account_id = a.account_id
       WHERE e.expense_id = ? AND a.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (check.length === 0) return res.status(404).json({ message: 'Expense not found' });

    await db.query(
      'INSERT IGNORE INTO EXPENSE_TAG (expense_id, tag_id) VALUES (?, ?)',
      [req.params.id, tag_id]
    );
    res.status(201).json({ message: 'Tag added' });
  } catch (err) { next(err); }
};

// DELETE /api/expenses/:id/tags/:tag_id
const removeTag = async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM EXPENSE_TAG WHERE expense_id = ? AND tag_id = ?',
      [req.params.id, req.params.tag_id]
    );
    res.json({ message: 'Tag removed' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, addNote, addTag, removeTag };
