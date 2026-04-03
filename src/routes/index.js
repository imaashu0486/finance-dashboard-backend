const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const ledgerRoutes = require('./financialRecord.routes');
const dashboardRoutes = require('./dashboard.routes');

const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/financial-records', ledgerRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

module.exports = apiRouter;
