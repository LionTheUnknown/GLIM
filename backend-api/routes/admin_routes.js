const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin_controller');
const { authenticateToken, requireAdmin } = require('../middleware');

router.use(authenticateToken);
router.use(requireAdmin);

router.delete('/posts/:postId', adminController.deleteAnyPost);
router.patch('/posts/:postId/revive', adminController.revivePost);
router.patch('/posts/:postId/pin', adminController.togglePinPost);
router.delete('/posts/:postId/comments/:commentId', adminController.deleteAnyComment);

router.get('/categories/pending', adminController.getPendingCategories);
router.patch('/categories/:categoryId/approve', adminController.approveCategory);

module.exports = router;

