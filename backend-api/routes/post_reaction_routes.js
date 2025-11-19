const express = require('express');
const router = express.Router({ mergeParams: true });
const reactionController = require('../controllers/post_reaction_controller')
const { authenticateToken } = require('../middleware');

//router.post('/', authenticateToken, reactionController.handlePostReaction);
router.get('/', reactionController.getPostReactionCounts);
router.post('/', authenticateToken, reactionController.createPostReaction);
router.get('/me', authenticateToken, reactionController.getPostReaction);
router.put('/:reactionId', authenticateToken, reactionController.updatePostReaction);
router.delete('/:reactionId', authenticateToken, reactionController.deletePostReaction);

module.exports = router;