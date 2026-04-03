const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { respondOk } = require('../utils/response');
const { env } = require('../config/env');
const { setAuthCookies, clearAuthCookies } = require('../utils/authCookies');

const resolveRefreshToken = (req) => req.body.refreshToken || req.cookies?.[env.refreshCookieName];

const login = asyncHandler(async (req, res) => {
  const authPayload = await authService.login({
    ...req.body,
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || ''
  });

  if (env.authCookieEnabled) {
    setAuthCookies(res, {
      accessToken: authPayload.accessToken,
      refreshToken: authPayload.refreshToken
    });
  }

  return respondOk(res, 200, 'Login successful', authPayload);
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = resolveRefreshToken(req);

  const refreshedSession = await authService.rotateRefreshToken({
    refreshToken: token,
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || ''
  });

  if (env.authCookieEnabled) {
    setAuthCookies(res, {
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken
    });
  }

  return respondOk(res, 200, 'Token refreshed successfully', refreshedSession);
});

const logout = asyncHandler(async (req, res) => {
  const token = resolveRefreshToken(req);
  await authService.logout(token);

  if (env.authCookieEnabled) {
    clearAuthCookies(res);
  }

  return respondOk(res, 200, 'Logged out successfully', {});
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);

  if (env.authCookieEnabled) {
    clearAuthCookies(res);
  }

  return respondOk(res, 200, 'Logged out from all sessions successfully', {});
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  return respondOk(res, 200, 'Profile fetched successfully', profile);
});

module.exports = {
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile
};
