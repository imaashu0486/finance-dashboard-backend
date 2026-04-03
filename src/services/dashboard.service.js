const FinancialRecord = require('../models/FinancialRecord');
const { buildRecordFilter } = require('./financialRecord.service');

const buildDashboardMatchStage = (query) => ({ $match: buildRecordFilter(query) });

const getTotals = async (query) => {
  const groupedTotals = await FinancialRecord.aggregate([
    buildDashboardMatchStage(query),
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);

  const income = groupedTotals.find((groupRow) => groupRow._id === 'income')?.total || 0;
  const expense = groupedTotals.find((groupRow) => groupRow._id === 'expense')?.total || 0;

  return {
    totalIncome: income,
    totalExpense: expense,
    netBalance: income - expense
  };
};

const getCategoryWiseTotals = async (query) => {
  return FinancialRecord.aggregate([
    buildDashboardMatchStage(query),
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id',
        total: 1,
        count: 1
      }
    }
  ]);
};

const getMonthlyTrends = async (query) => {
  return FinancialRecord.aggregate([
    buildDashboardMatchStage(query),
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        type: '$_id.type',
        total: 1
      }
    }
  ]);
};

const getLastTransactions = async (query) => {
  const filter = buildRecordFilter(query);
  const limit = Number(query.limit) || 5;

  return FinancialRecord.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .select('amount type category date notes createdAt updatedAt')
    .lean();
};

const getTopExpenseCategories = async (query) => {
  const limit = Number(query.limit) || 3;

  return FinancialRecord.aggregate([
    buildDashboardMatchStage({ ...query, type: 'expense' }),
    {
      $group: {
        _id: '$category',
        totalExpense: { $sum: '$amount' }
      }
    },
    { $sort: { totalExpense: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        category: '$_id',
        totalExpense: 1
      }
    }
  ]);
};

const getDashboardSummary = async (query) => {
  // Single aggregation call keeps dashboard widgets consistent at the same point in time.
  const [summarySnapshot] = await FinancialRecord.aggregate([
    buildDashboardMatchStage(query),
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' }
            }
          }
        ],
        categoryWise: [
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { total: -1 } },
          {
            $project: {
              _id: 0,
              category: '$_id',
              total: 1,
              count: 1
            }
          }
        ],
        monthlyTrends: [
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                type: '$type'
              },
              total: { $sum: '$amount' }
            }
          },
          {
            $sort: {
              '_id.year': 1,
              '_id.month': 1
            }
          },
          {
            $project: {
              _id: 0,
              year: '$_id.year',
              month: '$_id.month',
              type: '$_id.type',
              total: 1
            }
          }
        ],
        lastTransactions: [
          { $sort: { date: -1, createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              _id: 1,
              amount: 1,
              type: 1,
              category: 1,
              date: 1,
              notes: 1,
              createdAt: 1,
              updatedAt: 1
            }
          }
        ]
      }
    }
  ]);

  const totals = summarySnapshot?.totals || [];
  const income = totals.find((groupRow) => groupRow._id === 'income')?.total || 0;
  const expense = totals.find((groupRow) => groupRow._id === 'expense')?.total || 0;

  return {
    totalIncome: income,
    totalExpense: expense,
    netBalance: income - expense,
    categoryWise: summarySnapshot?.categoryWise || [],
    monthlyTrends: summarySnapshot?.monthlyTrends || [],
    lastTransactions: summarySnapshot?.lastTransactions || []
  };
};

module.exports = {
  getTotals,
  getCategoryWiseTotals,
  getMonthlyTrends,
  getLastTransactions,
  getTopExpenseCategories,
  getDashboardSummary
};
