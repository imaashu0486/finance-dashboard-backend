const Joi = require('joi');
const { ROLES } = require('../constants/roles');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .default(ROLES.USER)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional()
});

module.exports = { registerSchema, loginSchema, refreshTokenSchema };
