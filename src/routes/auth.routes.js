const express = require('express');

const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { loginSchema, refreshTokenSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', validate(refreshTokenSchema), authController.logout);
router.post('/logout-all', requireAuth, authController.logoutAll);
router.get('/me', requireAuth, authController.getProfile);

module.exports = router;
