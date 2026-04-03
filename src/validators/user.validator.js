const Joi = require('joi');
const { ROLES } = require('../constants/roles');

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email(),
  password: Joi.string().min(8).max(128),
  role: Joi.string().valid(...Object.values(ROLES)),
  status: Joi.string().valid('active', 'inactive')
}).min(1);

module.exports = { createUserSchema, updateUserSchema };
