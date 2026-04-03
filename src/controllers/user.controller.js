const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const { respondOk } = require('../utils/response');

const createUser = asyncHandler(async (req, res) => {
  const createdUser = await userService.createUser(req.body);
  return respondOk(res, 201, 'User created successfully', { user: createdUser });
});

const getUsers = asyncHandler(async (_req, res) => {
  const users = await userService.getUsers();
  return respondOk(res, 200, 'Users fetched successfully', { users });
});

const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body);
  return respondOk(res, 200, 'User updated successfully', { user: updatedUser });
});

module.exports = {
  createUser,
  getUsers,
  updateUser
};
