const express = require('express');
const router = express.Router({ mergeParams: true });
const reactionController = require('../controllers/comment_reaction_controller')
const { authenticateToken } = require('../middleware');

// router.post('/', authenticateToken, reactionController.handlePostReaction);
router.get('/', reactionController.getCommentReactionCounts);
router.post('/', authenticateToken, reactionController.createCommentReaction);
router.get('/me', authenticateToken, reactionController.getCommentReaction);
router.put('/:reactionId', authenticateToken, reactionController.updateCommentReaction);
router.delete('/:reactionId', authenticateToken, reactionController.deleteCommentReaction);

module.exports = router;