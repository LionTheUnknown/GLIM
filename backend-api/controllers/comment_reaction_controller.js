const { pool } = require('../db');

// GET COMMENT REACTION
exports.getCommentReaction = async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user?.user_id; 

    if (!postId || !commentId) {
        return res.status(400).json({ error: "Missing required Post ID or Comment ID parameter." });
    }
    
    if (!userId) {
        return res.status(200).json({ user_reaction_type: null });
    }

    try {
        const userReactionResult = await pool.query(`
            SELECT reaction_type 
            FROM reactions 
            WHERE user_id = $1 
            AND comment_id = $2 
            AND post_id IS NULL
            LIMIT 1
        `, [userId, commentId]);
        
        const userReactionType = userReactionResult.rows[0]?.reaction_type || null;
            
        res.status(200).json({
            user_reaction_type: userReactionType
        });

    } catch (err) {
        console.error('Error fetching comment reaction details:', err.message);
        res.status(500).json({ error: 'Failed to retrieve reaction details.', details: err.message });
    }
};

// CREATE COMMENT REACTION
exports.createCommentReaction = async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user.user_id; 
    const reactionType = req.body.reaction_type;

    if (!postId || !commentId) {
        return res.status(400).json({ error: "Missing required Post ID or Comment ID parameter." });
    }

    if (!reactionType || (reactionType !== 'like' && reactionType !== 'dislike')) {
        return res.status(400).json({ error: "Invalid reaction type. Must be 'like' or 'dislike'." });
    }

    try {
        const commentCheck = await pool.query(`
            SELECT 1 FROM comments
            WHERE comment_id = $1 AND post_id = $2
        `, [commentId, postId]);

        if (commentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found for the given post.' });
        }

        const checkResult = await pool.query(`
            SELECT 1 FROM reactions 
            WHERE user_id = $1 
            AND comment_id = $2 
            AND post_id IS NULL
        `, [userId, commentId]);
        
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ error: 'Conflict: Reaction already exists. Use PUT to update.' });
        }

        await pool.query(`
            INSERT INTO reactions (user_id, post_id, comment_id, reaction_type, created_at)
            VALUES ($1, NULL, $2, $3, CURRENT_TIMESTAMP)
        `, [userId, commentId, reactionType]);

        res.status(201).json({ message: 'Reaction created successfully.'});

    } catch (err) {
        console.error('Error creating comment reaction:', err.message);
        res.status(500).json({ error: 'Failed to create comment reaction.', details: err.message });
    }
};

// UPDATE COMMENT REACTION
exports.updateCommentReaction = async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user.user_id;
    const reactionType = req.body.reaction_type;

    if (!reactionType || (reactionType !== 'like' && reactionType !== 'dislike')) {
        return res.status(400).json({ error: "Invalid reaction type. Must be 'like' or 'dislike'." });
    }

    try {
        const result = await pool.query(`
            UPDATE reactions 
            SET reaction_type = $1, created_at = CURRENT_TIMESTAMP
            WHERE user_id = $2 
            AND post_id IS NULL 
            AND comment_id = $3
        `, [reactionType, userId, commentId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Reaction not found for update. Use POST to create.' });
        }

        res.status(200).json({ message: 'Reaction updated successfully.'});

    } catch (err) {
        console.error('Error updating comment reaction:', err.message);
        res.status(500).json({ error: 'Failed to update comment reaction.', details: err.message });
    }
};

// DELETE COMMENT REACTION
exports.deleteCommentReaction = async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(`
            DELETE FROM reactions 
            WHERE user_id = $1 
            AND post_id IS NULL 
            AND comment_id = $2
        `, [userId, commentId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Reaction not found for deletion.' });
        }

        res.status(200).json({ message: 'Reaction deleted successfully.' });

    } catch (err) {
        console.error('Error deleting comment reaction:', err.message);
        res.status(500).json({ error: 'Failed to delete comment reaction.', details: err.message });
    }
};

// GET COMMENT REACTION COUNTS
exports.getCommentReactionCounts = async (req, res) => {
    const postIdParam = req.params?.postId; 
    const commentIdParam = req.params?.commentId;

    if (!postIdParam || !commentIdParam) {
        return res.status(400).json({ error: "Missing required post ID or comment ID parameter." });
    }

    const postId = parseInt(postIdParam, 10);
    const commentId = parseInt(commentIdParam, 10);
    
    if (Number.isNaN(postId) || postId <= 0 || Number.isNaN(commentId) || commentId <= 0) {
        return res.status(400).json({ error: "Invalid Post ID or Comment ID format." });
    }

    try {
        const commentCheck = await pool.query(`
            SELECT 1 FROM comments
            WHERE comment_id = $1 AND post_id = $2
        `, [commentId, postId]);

        if (commentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found for this post.' });
        }

        const result = await pool.query(`
            SELECT 
                COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) AS like_count,
                COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) AS dislike_count
            FROM reactions
            WHERE comment_id = $1 AND post_id IS NULL
        `, [commentId]);

        const countsResult = result.rows[0];
        const counts = {
            like_count: parseInt(countsResult.like_count) || 0,
            dislike_count: parseInt(countsResult.dislike_count) || 0,
        };

        res.status(200).json(counts);
    } catch (err) {
        console.error('Error fetching comment reaction counts:', err.message);
        res.status(500).json({ error: 'Failed to retrieve comment reaction counts.', details: err.message });
    }
};

// HANDLE COMMENT REACTION
exports.handleCommentReaction = async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user.user_id;
    const reaction_type = req.body.reaction_type;

    if (!postId || !commentId || !userId) {
        return res.status(400).json({ error: "Missing required parameters." });
    }

    try {
        const existing = await pool.query(`
            SELECT reaction_type 
            FROM reactions 
            WHERE user_id = $1 AND comment_id = $2 AND post_id IS NULL
            LIMIT 1
        `, [userId, commentId]);

        const currentReaction = existing.rows[0]?.reaction_type || null;
        
        if (currentReaction === reaction_type) {
            return exports.deleteCommentReaction(req, res);
        }
        else if (currentReaction !== null && currentReaction !== reaction_type) {
            return exports.updateCommentReaction(req, res);
        }
        else if (currentReaction === null) {
            return exports.createCommentReaction(req, res);
        }
        
        return res.status(400).json({ error: "Invalid reaction type or no change." });

    } catch (err) {
        console.error('Error handling comment reaction:', err.message);
        res.status(500).json({ error: 'Failed to handle comment reaction.', details: err.message });
    }
};

