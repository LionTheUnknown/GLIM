const express = require('express');
const router = express.Router();
const postController = require('../controllers/post_controller');
const categoryController = require('../controllers/category_controller');
const { authenticateToken } = require('../middleware');

router.get('/', categoryController.getAllCategories);
router.post('/', authenticateToken, categoryController.createCategory);
router.get('/:categoryId', categoryController.getCategoryById);
router.put('/:categoryId', authenticateToken, categoryController.updateCategory);
router.delete('/:categoryId', authenticateToken, categoryController.deleteCategory);

router.use('/:categoryId/posts', require('./post_routes')); 

module.exports = router;