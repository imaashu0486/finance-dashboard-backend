const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional()
});

module.exports = { loginSchema, refreshTokenSchema };
