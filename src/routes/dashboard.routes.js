const express = require('express');

const dashboardController = require('../controllers/dashboard.controller');
const requireAuth = require('../middleware/auth.middleware');
const allowPermissions = require('../middleware/permission.middleware');
const validate = require('../middleware/validate.middleware');
const { dashboardQuerySchema } = require('../validators/dashboard.validator');

const router = express.Router();

router.use(requireAuth);
router.use(allowPermissions('summary'));

router.get('/total-income', validate(dashboardQuerySchema, 'query'), dashboardController.getTotalIncome);
router.get('/total-expense', validate(dashboardQuerySchema, 'query'), dashboardController.getTotalExpense);
router.get('/net-balance', validate(dashboardQuerySchema, 'query'), dashboardController.getNetBalance);
router.get('/category-wise', validate(dashboardQuerySchema, 'query'), dashboardController.getCategoryWiseTotals);
router.get('/monthly-trends', validate(dashboardQuerySchema, 'query'), dashboardController.getMonthlyTrends);
router.get('/last-transactions', validate(dashboardQuerySchema, 'query'), dashboardController.getLastTransactions);
router.get('/top-expense-categories', validate(dashboardQuerySchema, 'query'), dashboardController.getTopExpenseCategories);
router.get('/summary', validate(dashboardQuerySchema, 'query'), dashboardController.getSummary);

module.exports = router;
