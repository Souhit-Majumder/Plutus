require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/users',           require('./routes/users'));
app.use('/api/accounts',        require('./routes/accounts'));
app.use('/api/expenses',        require('./routes/expenses'));
app.use('/api/income',          require('./routes/income'));
app.use('/api/budgets',         require('./routes/budgets'));
app.use('/api/categories',      require('./routes/categories'));
app.use('/api/payment-methods', require('./routes/paymentMethods'));
app.use('/api/recurring',       require('./routes/recurringPayments'));
app.use('/api/savings-goals',   require('./routes/savingsGoals'));
app.use('/api/reminders',       require('./routes/reminders'));
app.use('/api/persons',         require('./routes/persons'));
app.use('/api/loans',           require('./routes/loans'));
app.use('/api/tags',            require('./routes/tags'));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
