const { ROLES } = require('./roles');

const permissions = {
  [ROLES.ADMIN]: ['create', 'read', 'update', 'delete', 'summary'],
  [ROLES.ANALYST]: ['read', 'summary'],
  [ROLES.VIEWER]: ['summary'],
  [ROLES.USER]: ['read']
};

module.exports = { permissions };
