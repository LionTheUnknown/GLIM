const express = require('express');
const router = express.Router({ mergeParams: true });
const postController = require('../controllers/post_controller');
const { authenticateToken } = require('../middleware');

router.post('/', authenticateToken, postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/:postId', postController.getPostById);
router.put('/:postId', authenticateToken, postController.updatePost);
router.delete('/:postId', authenticateToken, postController.deletePost);

const commentRouter = require('./comment_routes');
router.use('/:postId/comments', commentRouter);

const reactionRouter = require('./post_reaction_routes');
router.use('/:postId/reactions', reactionRouter);

module.exports = router;