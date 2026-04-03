const app = require('./app');
const connectDatabase = require('./config/db');
const { env } = require('./config/env');
const { seedDefaultUsers } = require('./services/seed.service');

const bootstrap = async () => {
  await connectDatabase();
  await seedDefaultUsers();

  app.listen(env.port, () => {
    console.log(`API server is up on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
