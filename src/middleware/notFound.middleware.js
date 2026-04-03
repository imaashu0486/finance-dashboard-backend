const ApiError = require('../utils/ApiError');

const notFoundMiddleware = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

module.exports = notFoundMiddleware;
