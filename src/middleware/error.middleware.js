const errorMiddleware = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Mongoose invalid object id / cast errors
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource id';
  }

  // Mongoose duplicate key errors
  if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value violates unique constraint';
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: {}
  });
};

module.exports = errorMiddleware;
