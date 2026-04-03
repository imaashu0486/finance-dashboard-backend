const express = require('express');

const userController = require('../controllers/user.controller');
const requireAuth = require('../middleware/auth.middleware');
const allowPermissions = require('../middleware/permission.middleware');
const validate = require('../middleware/validate.middleware');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');

const router = express.Router();

router.use(requireAuth);

router.post('/', allowPermissions('create'), validate(createUserSchema), userController.createUser);
router.get('/', allowPermissions('read'), userController.getUsers);
router.patch('/:id', allowPermissions('update'), validate(updateUserSchema), userController.updateUser);

module.exports = router;
