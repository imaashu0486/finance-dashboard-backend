const { permissions } = require('../constants/permissions');
const ApiError = require('../utils/ApiError');

const allowPermissions = (...requiredPermissions) => (req, _res, next) => {
  // Prefer role from JWT payload. Keep x-role fallback for backward compatibility.
  const roleFromToken = req.user?.role;
  const roleFromHeader = req.header('x-role');
  const roleSource = roleFromToken || roleFromHeader;
  const role = typeof roleSource === 'string' ? roleSource.toLowerCase() : '';

  if (!role || !permissions[role]) {
    return next(new ApiError(403, 'Invalid or missing role'));
  }

  const allowed = permissions[role] || [];
  const hasAllPermissions = requiredPermissions.every((permission) => allowed.includes(permission));

  if (!hasAllPermissions) {
    return next(new ApiError(403, 'Forbidden: insufficient permissions'));
  }

  req.role = role;
  return next();
};

module.exports = allowPermissions;
