const ms = require('ms');
const { env } = require('../config/env');

const getCookieBaseOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  domain: env.authCookieDomain,
  path: '/'
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const baseOptions = getCookieBaseOptions();

  res.cookie(env.accessCookieName, accessToken, {
    ...baseOptions,
    maxAge: ms(env.jwtExpiresIn)
  });

  res.cookie(env.refreshCookieName, refreshToken, {
    ...baseOptions,
    maxAge: ms(env.refreshTokenExpiresIn)
  });
};

const clearAuthCookies = (res) => {
  const baseOptions = getCookieBaseOptions();
  res.clearCookie(env.accessCookieName, baseOptions);
  res.clearCookie(env.refreshCookieName, baseOptions);
};

module.exports = {
  setAuthCookies,
  clearAuthCookies
};
