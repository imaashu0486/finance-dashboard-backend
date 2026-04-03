const respondOk = (res, statusCode, message, payload = {}) =>
  res.status(statusCode).json({
    success: true,
    message,
    data: payload
  });

module.exports = { respondOk };
