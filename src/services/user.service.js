const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

const toPublicUserDto = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  status: userDoc.status,
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt
});

const createUser = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'User email already exists');
  }

  const createdUser = await User.create(payload);
  return toPublicUserDto(createdUser);
};

const getUsers = async () => {
  const userDocs = await User.find().sort({ createdAt: -1 }).lean();
  return userDocs.map(toPublicUserDto);
};

const updateUser = async (userId, payload) => {
  const updatePayload = { ...payload };

  if (updatePayload.password) {
    // Password update is intentionally explicit here so accidental plaintext never reaches DB.
    updatePayload.password = await bcrypt.hash(updatePayload.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
    new: true,
    runValidators: true
  });

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return toPublicUserDto(updatedUser);
};

module.exports = {
  createUser,
  getUsers,
  updateUser
};
