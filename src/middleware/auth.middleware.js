const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

const requireAuth = (req, _res, next) => {
  const authHeader = req.header('authorization') || '';
  const [, bearerToken] = authHeader.split(' ');
  const cookieToken = req.cookies?.[env.accessCookieName];
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new ApiError(401, 'Unauthorized: missing Bearer token'));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (decoded.tokenType !== 'access') {
      return next(new ApiError(401, 'Unauthorized: invalid token type'));
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email
    };
    return next();
  } catch (_error) {
    return next(new ApiError(401, 'Unauthorized: invalid or expired token'));
  }
};

module.exports = requireAuth;
