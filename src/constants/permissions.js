const { ROLES } = require('./roles');

const permissions = {
  [ROLES.ADMIN]: ['create', 'read', 'update', 'delete', 'summary'],
  [ROLES.ANALYST]: ['read', 'summary'],
  [ROLES.VIEWER]: ['read']
};

module.exports = { permissions };
