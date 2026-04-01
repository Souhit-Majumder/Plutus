const db = require('../config/db');

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const nextDate = (start, frequency, step) => {
  const d = new Date(start);

  if (frequency === 'daily')   d.setDate(d.getDate() + step);
  if (frequency === 'weekly')  d.setDate(d.getDate() + step * 7);
  if (frequency === 'monthly') d.setMonth(d.getMonth() + step);
  if (frequency === 'yearly')  d.setFullYear(d.getFullYear() + step);

  return d;
};

const runRecurringPayments = async () => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const [subs] = await db.query(`
      SELECT *
      FROM RECURRING_PAYMENT
      WHERE status = 'active'
        AND start_date <= CURDATE()
        AND (end_date IS NULL OR end_date >= CURDATE())
    `);

    for (const sub of subs) {

      let i = 0;

      while (true) {

        const paymentDate = nextDate(sub.start_date, sub.frequency, i);
        const paymentStr  = paymentDate.toISOString().split('T')[0];

        if (paymentDate > today) break;

        // check if already exists
        const [exists] = await db.query(
          `SELECT 1 FROM EXPENSE
           WHERE account_id = ?
             AND amount = ?
             AND date = ?
             AND description = ?
           LIMIT 1`,
          [
            sub.account_id,
            sub.amount,
            paymentStr,
            sub.title || 'Recurring Payment'
          ]
        );

        if (exists.length === 0) {

          await db.query(
            `INSERT INTO EXPENSE
             (account_id, category_id, payment_method_id, amount, date, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              sub.account_id,
              sub.category_id,
              sub.payment_method_id,
              sub.amount,
              paymentStr,
              sub.title || 'Recurring Payment'
            ]
          );

          console.log(`Added missed payment for ${sub.title || sub.recurring_id} (${paymentStr})`);
        }

        i++;
      }
    }

  } catch (err) {
    console.error('Recurring processor error:', err);
  }
};

module.exports = runRecurringPayments;