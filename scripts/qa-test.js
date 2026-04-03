/* eslint-disable no-console */
const assert = require('assert');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const run = async () => {
  const mongod = await MongoMemoryServer.create();

  process.env.NODE_ENV = 'test';
  process.env.PORT = '5051';
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'qa_access_secret';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_SECRET = 'qa_refresh_secret';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  process.env.AUTH_COOKIE_ENABLED = 'false';

  const connectDB = require('../src/config/db');
  const app = require('../src/app');
  const User = require('../src/models/User');

  try {
    await connectDB();
    const api = request(app);

    // Seed users
    await User.create([
      {
        name: 'Admin',
        email: 'admin@qa.com',
        password: 'SecurePass123',
        role: 'admin',
        status: 'active'
      },
      {
        name: 'Analyst',
        email: 'analyst@qa.com',
        password: 'SecurePass123',
        role: 'analyst',
        status: 'active'
      },
      {
        name: 'Viewer',
        email: 'viewer@qa.com',
        password: 'SecurePass123',
        role: 'viewer',
        status: 'active'
      }
    ]);

    // Login by role
    const adminLogin = await api.post('/api/auth/login').send({ email: 'admin@qa.com', password: 'SecurePass123' });
    const analystLogin = await api
      .post('/api/auth/login')
      .send({ email: 'analyst@qa.com', password: 'SecurePass123' });
    const viewerLogin = await api.post('/api/auth/login').send({ email: 'viewer@qa.com', password: 'SecurePass123' });

    assert.strictEqual(adminLogin.status, 200);
    assert.strictEqual(analystLogin.status, 200);
    assert.strictEqual(viewerLogin.status, 200);

    const adminToken = adminLogin.body.data.accessToken;
    const analystToken = analystLogin.body.data.accessToken;
    const viewerToken = viewerLogin.body.data.accessToken;

    // Validation error checks
    const invalidRecord = await api
      .post('/api/financial-records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: -1, type: 'income', category: 'Salary', date: '2026-04-01', notes: '' });
    assert.strictEqual(invalidRecord.status, 400);

    // CRUD checks (admin)
    const createRecordRes = await api
      .post('/api/financial-records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 2000, type: 'income', category: 'Salary', date: '2026-04-01', notes: 'Income' });
    assert.strictEqual(createRecordRes.status, 201);
    const recordId = createRecordRes.body.data.record._id;

    const getRecordsRes = await api
      .get('/api/financial-records?page=1&limit=10&type=income&category=Salary&search=Income')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(getRecordsRes.status, 200);

    const updateRecordRes = await api
      .patch(`/api/financial-records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Updated' });
    assert.strictEqual(updateRecordRes.status, 200);

    const deleteRecordRes = await api
      .delete(`/api/financial-records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(deleteRecordRes.status, 200);

    // Unauthorized / wrong role checks
    const analystCreateDenied = await api
      .post('/api/financial-records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: 100, type: 'expense', category: 'Food', date: '2026-04-02', notes: 'Denied create' });
    assert.strictEqual(analystCreateDenied.status, 403);

    const viewerDashboardDenied = await api
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);
    assert.strictEqual(viewerDashboardDenied.status, 403);

    const noTokenDenied = await api.get('/api/users');
    assert.strictEqual(noTokenDenied.status, 401);

    // Edge cases
    const invalidDateRange = await api
      .get('/api/financial-records?startDate=2026-12-31&endDate=2026-01-01')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(invalidDateRange.status, 400);

    const invalidObjectId = await api
      .patch('/api/financial-records/not-a-valid-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'test' });
    assert.strictEqual(invalidObjectId.status, 400);

    // Dashboard read checks (analyst)
    const dashboardEndpoints = [
      '/api/dashboard/total-income',
      '/api/dashboard/total-expense',
      '/api/dashboard/net-balance',
      '/api/dashboard/category-wise',
      '/api/dashboard/monthly-trends',
      '/api/dashboard/last-transactions?limit=5',
      '/api/dashboard/top-expense-categories?limit=3',
      '/api/dashboard/summary'
    ];

    for (const endpoint of dashboardEndpoints) {
      const res = await api.get(endpoint).set('Authorization', `Bearer ${analystToken}`);
      assert.strictEqual(res.status, 200, endpoint);
      assert.strictEqual(typeof res.body.success, 'boolean');
      assert.strictEqual(typeof res.body.message, 'string');
      assert.strictEqual(typeof res.body.data, 'object');
    }

    console.log('✅ QA tests passed (CRUD, role checks, validation, edge cases).');
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
};

run().catch((error) => {
  console.error('❌ QA tests failed:', error);
  process.exit(1);
});
