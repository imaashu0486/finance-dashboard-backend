const mongoose = require('mongoose');
const { env } = require('./env');

const connectDatabase = async () => {
  // Keeping this small on purpose so connection behavior is easy to reason about.
  await mongoose.connect(env.mongodbUri);
  console.log('MongoDB connection established');
};

module.exports = connectDatabase;
