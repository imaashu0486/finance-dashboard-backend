const ApiError = require('../utils/ApiError');

const validate = (schema, property = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map((item) => item.message).join(', ');
    return next(new ApiError(400, `Validation error: ${details}`));
  }

  req[property] = value;
  return next();
};

module.exports = validate;
