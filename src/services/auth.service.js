const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const ApiError = require('../utils/ApiError');
const { env } = require('../config/env');

const signAccessToken = (user) =>
  jwt.sign(
    {
      tokenType: 'access',
      role: user.role,
      email: user.email
    },
    env.jwtSecret,
    {
      subject: user._id.toString(),
      expiresIn: env.jwtExpiresIn
    }
  );

const signRefreshToken = (user, tokenId) =>
  jwt.sign(
    {
      tokenType: 'refresh',
      role: user.role,
      email: user.email,
      jti: tokenId
    },
    env.refreshTokenSecret,
    {
      subject: user._id.toString(),
      expiresIn: env.refreshTokenExpiresIn
    }
  );

const readJwtExpiry = (token) => {
  const decodedPayload = jwt.decode(token);
  if (!decodedPayload?.exp) {
    throw new ApiError(500, 'Unable to parse token expiration');
  }

  return new Date(decodedPayload.exp * 1000);
};

const revokeEveryActiveSession = async (userId) => {
  // We keep this separate so it can be reused by logout-all and token reuse protection.
  await AuthSession.updateMany(
    { userId, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } }
  );
};

const issueTokenPair = async ({ user, userAgent = '', ipAddress = '' }) => {
  const refreshTokenId = crypto.randomUUID();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, refreshTokenId);

  await AuthSession.create({
    userId: user._id,
    tokenId: refreshTokenId,
    userAgent,
    ipAddress,
    expiresAt: readJwtExpiry(refreshToken)
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: env.jwtExpiresIn,
    refreshTokenExpiresIn: env.refreshTokenExpiresIn
  };
};

const login = async ({ email, password, userAgent, ipAddress }) => {
  const account = await User.findOne({ email: email.toLowerCase(), status: 'active' }).select('+password');

  if (!account) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isPasswordValid = await account.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const sessionTokens = await issueTokenPair({ user: account, userAgent, ipAddress });

  return {
    ...sessionTokens,
    user: {
      id: account._id,
      name: account.name,
      email: account.email,
      role: account.role,
      status: account.status
    }
  };
};

const rotateRefreshToken = async ({ refreshToken, userAgent = '', ipAddress = '' }) => {
  if (!refreshToken) {
    throw new ApiError(400, 'refreshToken is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.refreshTokenSecret);
  } catch (_error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  if (decoded.tokenType !== 'refresh' || !decoded.jti || !decoded.sub) {
    throw new ApiError(401, 'Invalid refresh token payload');
  }

  const session = await AuthSession.findOne({
    tokenId: decoded.jti,
    userId: decoded.sub,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    // Refresh token reuse detection:
    // If token exists but already revoked, treat as potential compromise and revoke all sessions.
    const reusedSession = await AuthSession.findOne({
      tokenId: decoded.jti,
      userId: decoded.sub,
      revokedAt: { $ne: null }
    });

    if (reusedSession) {
      await revokeEveryActiveSession(decoded.sub);
      throw new ApiError(401, 'Refresh token reuse detected. All sessions have been revoked.');
    }

    throw new ApiError(401, 'Refresh session is invalid or revoked');
  }

  const account = await User.findOne({ _id: decoded.sub, status: 'active' });
  if (!account) {
    throw new ApiError(401, 'User not active for refresh');
  }

  const newTokenId = crypto.randomUUID();
  const accessToken = signAccessToken(account);
  const newRefreshToken = signRefreshToken(account, newTokenId);

  session.revokedAt = new Date();
  session.replacedByTokenId = newTokenId;
  await session.save();

  await AuthSession.create({
    userId: account._id,
    tokenId: newTokenId,
    userAgent,
    ipAddress,
    expiresAt: readJwtExpiry(newRefreshToken)
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    accessTokenExpiresIn: env.jwtExpiresIn,
    refreshTokenExpiresIn: env.refreshTokenExpiresIn
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.refreshTokenSecret);
  } catch (_error) {
    // Keep logout idempotent: do not expose token validity details.
    return;
  }

  if (decoded.tokenType !== 'refresh' || !decoded.jti || !decoded.sub) {
    return;
  }

  await AuthSession.updateOne(
    { tokenId: decoded.jti, userId: decoded.sub, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

const logoutAll = async (userId) => {
  await revokeEveryActiveSession(userId);
};

const getProfile = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
};

module.exports = {
  login,
  rotateRefreshToken,
  logout,
  logoutAll,
  getProfile
};
