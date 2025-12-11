const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const { authenticateToken } = require('../middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.post('/refresh', userController.refreshToken);

router.get('/me', authenticateToken, userController.getCurrentUser);

router.get('/', authenticateToken, userController.getAllUsers);

router.post('/me/avatar', authenticateToken, upload.single('file'), userController.uploadAvatar);
router.delete('/me/avatar', authenticateToken, userController.deleteAvatar);

module.exports = router;