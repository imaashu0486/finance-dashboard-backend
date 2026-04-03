const Joi = require('joi');
const { FINANCIAL_TYPES } = require('../constants/financialRecord');

const createFinancialRecordSchema = Joi.object({
  amount: Joi.number().positive().required(),
  type: Joi.string()
    .valid(...Object.values(FINANCIAL_TYPES))
    .required(),
  category: Joi.string().trim().min(2).max(100).required(),
  date: Joi.date().required(),
  notes: Joi.string().allow('').max(500).default('')
});

const updateFinancialRecordSchema = Joi.object({
  amount: Joi.number().positive(),
  type: Joi.string().valid(...Object.values(FINANCIAL_TYPES)),
  category: Joi.string().trim().min(2).max(100),
  date: Joi.date(),
  notes: Joi.string().allow('').max(500)
}).min(1);

const financialRecordQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid(...Object.values(FINANCIAL_TYPES)),
  category: Joi.string().trim(),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate')),
  search: Joi.string().trim().allow('')
});

module.exports = {
  createFinancialRecordSchema,
  updateFinancialRecordSchema,
  financialRecordQuerySchema
};
