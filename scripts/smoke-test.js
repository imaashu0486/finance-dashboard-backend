/* eslint-disable no-console */
const assert = require('assert');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const ensureResponseShape = (res) => {
  assert.strictEqual(typeof res.body.success, 'boolean');
  assert.strictEqual(typeof res.body.message, 'string');
  assert.strictEqual(typeof res.body.data, 'object');
};

const run = async () => {
  const mongod = await MongoMemoryServer.create();

  process.env.NODE_ENV = 'test';
  process.env.PORT = '5050';
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'smoke_access_secret';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_SECRET = 'smoke_refresh_secret';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  process.env.AUTH_COOKIE_ENABLED = 'false';

  const connectDB = require('../src/config/db');
  const app = require('../src/app');
  const User = require('../src/models/User');

  try {
    await connectDB();
    const api = request(app);

    // Seed admin for first login.
    await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'SecurePass123',
      role: 'admin',
      status: 'active'
    });

    // 1) Auth login
    const loginRes = await api.post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'SecurePass123'
    });
    assert.strictEqual(loginRes.status, 200);
    ensureResponseShape(loginRes);

    const accessToken = loginRes.body.data.accessToken;
    const refreshToken = loginRes.body.data.refreshToken;
    assert.ok(accessToken);
    assert.ok(refreshToken);

    // 2) Auth me
    const meRes = await api.get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    assert.strictEqual(meRes.status, 200);
    ensureResponseShape(meRes);

    // 3) Create user endpoint (doc)
    const createUserRes = await api
      .post('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Data Analyst',
        email: 'analyst@example.com',
        password: 'SecurePass123',
        role: 'analyst',
        status: 'active'
      });
    assert.strictEqual(createUserRes.status, 201);
    ensureResponseShape(createUserRes);

    // 4) Users list endpoint
    const usersRes = await api.get('/api/users').set('Authorization', `Bearer ${accessToken}`);
    assert.strictEqual(usersRes.status, 200);
    ensureResponseShape(usersRes);

    // 5) Financial records CRUD endpoints
    const rec1 = await api
      .post('/api/financial-records')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 5000,
        type: 'income',
        category: 'Salary',
        date: '2026-04-01',
        notes: 'Monthly salary'
      });
    assert.strictEqual(rec1.status, 201);
    ensureResponseShape(rec1);

    const rec2 = await api
      .post('/api/financial-records')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 1200,
        type: 'expense',
        category: 'Rent',
        date: '2026-04-02',
        notes: 'House rent'
      });
    assert.strictEqual(rec2.status, 201);

    const rec3 = await api
      .post('/api/financial-records')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 400,
        type: 'expense',
        category: 'Food',
        date: '2026-04-03',
        notes: 'Groceries'
      });
    assert.strictEqual(rec3.status, 201);

    const listRes = await api
      .get('/api/financial-records?page=1&limit=10&type=income&category=Salary&startDate=2026-01-01&endDate=2026-12-31&search=salary')
      .set('Authorization', `Bearer ${accessToken}`);
    assert.strictEqual(listRes.status, 200);
    ensureResponseShape(listRes);

    const recordId = rec1.body.data.record._id;
    const updateRes = await api
      .patch(`/api/financial-records/${recordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'Updated salary note' });
    assert.strictEqual(updateRes.status, 200);
    ensureResponseShape(updateRes);

    const deleteRes = await api
      .delete(`/api/financial-records/${recordId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    assert.strictEqual(deleteRes.status, 200);
    ensureResponseShape(deleteRes);

    // 6) Dashboard endpoints
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

    // Use analyst role to validate permission design from docs.
    const analystLogin = await api.post('/api/auth/login').send({
      email: 'analyst@example.com',
      password: 'SecurePass123'
    });
    const analystToken = analystLogin.body.data.accessToken;

    for (const endpoint of dashboardEndpoints) {
      const res = await api.get(endpoint).set('Authorization', `Bearer ${analystToken}`);
      assert.strictEqual(res.status, 200, `Expected 200 for ${endpoint}`);
      ensureResponseShape(res);
    }

    // 7) Refresh token rotation + logout
    const refreshRes = await api.post('/api/auth/refresh-token').send({ refreshToken });
    assert.strictEqual(refreshRes.status, 200);
    ensureResponseShape(refreshRes);

    const logoutRes = await api.post('/api/auth/logout').send({
      refreshToken: refreshRes.body.data.refreshToken
    });
    assert.strictEqual(logoutRes.status, 200);
    ensureResponseShape(logoutRes);

    const logoutAllRes = await api
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({});
    assert.strictEqual(logoutAllRes.status, 200);
    ensureResponseShape(logoutAllRes);

    // 8) Refresh reuse detection (old revoked token should fail)
    const reuseRes = await api.post('/api/auth/refresh-token').send({ refreshToken });
    assert.strictEqual(reuseRes.status, 401);
    assert.strictEqual(reuseRes.body.success, false);

    console.log('✅ Smoke test passed: all documented core endpoints are functional and standardized.');
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
};

run().catch((error) => {
  console.error('❌ Smoke test failed:', error);
  process.exit(1);
});
