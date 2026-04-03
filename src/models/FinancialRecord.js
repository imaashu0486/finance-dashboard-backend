const mongoose = require('mongoose');
const { FINANCIAL_TYPES } = require('../constants/financialRecord');

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    type: {
      type: String,
      enum: Object.values(FINANCIAL_TYPES),
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Core read path index: excludes deleted documents and supports default sorting by newest date.
financialRecordSchema.index({ isDeleted: 1, date: -1 });

// Optimizes type-based filtering and aggregation pre-match on active documents.
financialRecordSchema.index({ isDeleted: 1, type: 1, date: -1 });

// Optimizes category filter + date range queries.
financialRecordSchema.index({ isDeleted: 1, category: 1, date: -1 });

// Text search index for category/notes search filter.
financialRecordSchema.index({ category: 'text', notes: 'text' });

module.exports = mongoose.model('FinancialRecord', financialRecordSchema);
