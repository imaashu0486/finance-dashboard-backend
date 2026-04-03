const Joi = require('joi');

const dashboardQuerySchema = Joi.object({
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate')),
  limit: Joi.number().integer().min(1).max(50)
});

module.exports = { dashboardQuerySchema };
