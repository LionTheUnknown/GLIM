const sql = require('mssql');
const { poolPromise } = require('../db');

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
        const pool = await poolPromise;

        const userReactionResult = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('CommentId', sql.Int, commentId)
            .query(`
                SELECT TOP 1 reaction_type 
                FROM reactions 
                WHERE user_id = @UserId 
                AND comment_id = @CommentId 
                AND post_id IS NULL; -- CRITICAL: Respect parent exclusivity
            `);
        
        const userReactionType = userReactionResult.recordset[0]?.reaction_type || null;
            
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
        const pool = await poolPromise;

        const commentCheck = await pool.request()
            .input('CommentId', sql.Int, commentId)
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT 1 FROM comments
                WHERE comment_id = @CommentId
                AND post_id = @PostId;
            `);

        if (commentCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Comment not found for the given post.' });
        }

        const checkResult = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('CommentId', sql.Int, commentId)
            .query(`
                SELECT 1 FROM reactions 
                WHERE user_id = @UserId 
                AND comment_id = @CommentId 
                AND post_id IS NULL;
            `);
        
        if (checkResult.recordset.length > 0) {
            return res.status(409).json({ error: 'Conflict: Reaction already exists. Use PUT to update.' });
        }

        await pool.request()
            .input('UserId', sql.Int, userId)
            .input('CommentId', sql.Int, commentId)
            .input('ReactionType', sql.VarChar, reactionType)
            .query(`
                INSERT INTO reactions (user_id, post_id, comment_id, reaction_type, created_at)
                VALUES (@UserId, NULL, @CommentId, @ReactionType, GETDATE());
            `);

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
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('PostId', sql.Int, postId)
            .input('CommentId', sql.Int, commentId)
            .input('ReactionType', sql.VarChar, reactionType)
            .query(`
                UPDATE reactions 
                SET reaction_type = @ReactionType, created_at = GETDATE()
                WHERE user_id = @UserId 
                AND post_id IS NULL 
                AND comment_id = @CommentId;
            `);

        if (result.rowsAffected[0] === 0) {
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
        const pool = await poolPromise;

        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('PostId', sql.Int, postId)
            .input('CommentId', sql.Int, commentId)
            .query(`
                DELETE FROM reactions 
                WHERE user_id = @UserId 
                AND post_id IS NULL 
                AND comment_id = @CommentId;
            `);

        if (result.rowsAffected[0] === 0) {
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
        const pool = await poolPromise;
        
        const commentCheck = await pool.request()
            .input('PostId', sql.Int, postId)
            .input('CommentId', sql.Int, commentId)
            .query(`
                SELECT 1
                FROM comments
                WHERE comment_id = @CommentId AND post_id = @PostId; 
            `);

        if (commentCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Comment not found for this post.' });
        }

        const result = await pool.request()
            .input('PostId', sql.Int, postId)
            .input('CommentId', sql.Int, commentId)
            .query(`
                SELECT 
                    SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) AS like_count,
                    SUM(CASE WHEN reaction_type = 'dislike' THEN 1 ELSE 0 END) AS dislike_count
                FROM reactions
                WHERE post_id = @PostId AND comment_id = @CommentId;
            `);

        const countsResult = result.recordset[0];
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
