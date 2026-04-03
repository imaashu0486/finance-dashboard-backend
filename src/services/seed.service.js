const User = require('../models/User');
const { ROLES } = require('../constants/roles');

const DEFAULT_USERS = [
  {
    name: 'Admin Demo',
    email: 'admin@demo.com',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    status: 'active'
  },
  {
    name: 'Analyst Demo',
    email: 'analyst@demo.com',
    password: 'Analyst@123',
    role: ROLES.ANALYST,
    status: 'active'
  },
  {
    name: 'Viewer Demo',
    email: 'viewer@demo.com',
    password: 'Viewer@123',
    role: ROLES.VIEWER,
    status: 'active'
  }
];

const seedDefaultUsers = async () => {
  for (const userPayload of DEFAULT_USERS) {
    const normalizedEmail = userPayload.email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();

    if (existing) {
      continue;
    }

    try {
      await User.create({ ...userPayload, email: normalizedEmail });
      console.log(`Seeded default user: ${normalizedEmail}`);
    } catch (error) {
      if (error?.code === 11000) {
        // Safe in concurrent startup scenarios.
        continue;
      }

      throw error;
    }
  }
};

module.exports = {
  seedDefaultUsers
};
