const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');
const { respondOk } = require('../utils/response');

const sendBalanceMetric = async (req, res, metric, message) => {
  const balanceSnapshot = await dashboardService.getTotals(req.query);
  return respondOk(res, 200, message, {
    [metric]: balanceSnapshot[metric]
  });
};

const getTotalIncome = asyncHandler(async (req, res) => {
  return sendBalanceMetric(req, res, 'totalIncome', 'Total income fetched successfully');
});

const getTotalExpense = asyncHandler(async (req, res) => {
  return sendBalanceMetric(req, res, 'totalExpense', 'Total expense fetched successfully');
});

const getNetBalance = asyncHandler(async (req, res) => {
  return sendBalanceMetric(req, res, 'netBalance', 'Net balance fetched successfully');
});

const getCategoryWiseTotals = asyncHandler(async (req, res) => {
  const categoryWiseTotals = await dashboardService.getCategoryWiseTotals(req.query);
  return respondOk(res, 200, 'Category-wise totals fetched successfully', {
    categoryWiseTotals
  });
});

const getMonthlyTrends = asyncHandler(async (req, res) => {
  const monthlyTrends = await dashboardService.getMonthlyTrends(req.query);
  return respondOk(res, 200, 'Monthly trends fetched successfully', {
    monthlyTrends
  });
});

const getLastTransactions = asyncHandler(async (req, res) => {
  const transactions = await dashboardService.getLastTransactions(req.query);
  return respondOk(res, 200, 'Last transactions fetched successfully', {
    transactions
  });
});

const getTopExpenseCategories = asyncHandler(async (req, res) => {
  const categories = await dashboardService.getTopExpenseCategories(req.query);
  return respondOk(res, 200, 'Top expense categories fetched successfully', {
    categories
  });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.query);
  return respondOk(res, 200, 'Dashboard summary fetched successfully', {
    summary
  });
});

module.exports = {
  getTotalIncome,
  getTotalExpense,
  getNetBalance,
  getCategoryWiseTotals,
  getMonthlyTrends,
  getLastTransactions,
  getTopExpenseCategories,
  getSummary
};
