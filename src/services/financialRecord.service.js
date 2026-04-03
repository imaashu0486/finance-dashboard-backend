const FinancialRecord = require('../models/FinancialRecord');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');

const buildRecordFilter = ({ type, category, startDate, endDate, search }) => {
  // Base filter is always active-only; soft-deleted rows stay out of normal flows.
  const mongoFilter = { isDeleted: false };

  if (type) {
    mongoFilter.type = type;
  }

  if (category) {
    mongoFilter.category = category;
  }

  if (startDate || endDate) {
    mongoFilter.date = {};
    if (startDate) {
      mongoFilter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      mongoFilter.date.$lte = new Date(endDate);
    }
  }

  if (search) {
    // Text index on category + notes is used here.
    mongoFilter.$text = { $search: search };
  }

  return mongoFilter;
};

const createRecord = async (payload) => FinancialRecord.create(payload);

const getAllRecords = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const mongoFilter = buildRecordFilter(query);

  const [records, totalCount] = await Promise.all([
    FinancialRecord.find(mongoFilter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FinancialRecord.countDocuments(mongoFilter)
  ]);

  return {
    items: records,
    meta: {
      page,
      limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1
    }
  };
};

const updateRecord = async (recordId, payload) => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: recordId, isDeleted: false },
    payload,
    {
      new: true,
      runValidators: true
    }
  );

  if (!record) {
    throw new ApiError(404, 'Financial record not found');
  }

  return record;
};

const deleteRecord = async (recordId) => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: recordId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!record) {
    throw new ApiError(404, 'Financial record not found');
  }

  return record;
};

module.exports = {
  createRecord,
  getAllRecords,
  updateRecord,
  deleteRecord,
  buildRecordFilter
};
