const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  authCookieEnabled: process.env.AUTH_COOKIE_ENABLED === 'true',
  authCookieDomain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  accessCookieName: process.env.AUTH_ACCESS_COOKIE_NAME || 'accessToken',
  refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || 'refreshToken',
  swaggerServerUrl: process.env.SWAGGER_SERVER_URL || ''
};

if (!env.mongodbUri) {
  throw new Error('MONGODB_URI is required in environment variables');
}

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET is required in environment variables');
}

if (!env.refreshTokenSecret) {
  throw new Error('REFRESH_TOKEN_SECRET is required in environment variables');
}

module.exports = { env };
