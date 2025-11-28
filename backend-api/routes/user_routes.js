const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const { authenticateToken } = require('../middleware');

router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.post('/refresh', userController.refreshToken);

router.get('/me', authenticateToken, userController.getCurrentUser);

router.get('/', authenticateToken, userController.getAllUsers);

module.exports = router;