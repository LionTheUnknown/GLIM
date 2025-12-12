const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/comment_controller');
const { authenticateToken } = require('../middleware');

router.put('/:commentId', authenticateToken, commentController.updateComment);
router.delete('/:commentId', authenticateToken, commentController.deleteComment);
router.get('/', commentController.getCommentsByPost);
router.post('/', authenticateToken, commentController.createComment);
router.get('/:commentId', commentController.getComment);

const reactionRouter = require('./comment_reaction_routes');
router.use('/:commentId/reactions', reactionRouter);

module.exports = router;