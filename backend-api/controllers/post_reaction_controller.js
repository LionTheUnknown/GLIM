const sql = require('mssql');
const { poolPromise } = require('../db');

// GET POST REACTION
exports.getPostReaction = async (req, res) => {
    const postIdParam = req.params?.postId;
    const userId = req.user?.user_id;

    if (!postIdParam || !userId) {
        return res.status(400).json({ error: "Missing required parameters (Post ID or User ID)." });
    }

    const postId = parseInt(postIdParam, 10);
    if (Number.isNaN(postId) || postId <= 0) {
        return res.status(400).json({ error: "Invalid Post ID." });
    }

    try {
        const pool = await poolPromise;

        const postCheck = await pool.request()
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT 1
                FROM posts
                WHERE post_id = @PostId;
            `);

        if (postCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const result = await pool.request()
            .input('PostId', sql.Int, postId)
            .input('UserId', sql.Int, userId)
            .query(`
                SELECT TOP 1 reaction_type 
                FROM reactions 
                WHERE post_id = @PostId 
                AND user_id = @UserId 
                AND comment_id IS NULL;
            `);

        const userReactionType = result.recordset[0]?.reaction_type || null;

        res.status(200).json({ user_reaction_type: userReactionType });

    } catch (err) {
        console.error('Error fetching user post reaction:', err.message);
        res.status(500).json({ error: 'Failed to retrieve user reaction status.', details: err.message });
    }
};

// CREATE POST REACTION
exports.createPostReaction = async (req, res) => {
    const postId  = req.params?.postId;
    const userId = req.user.user_id;
    const reactionType = req.body.reaction_type;

    if (!postId || !userId) {
        return res.status(400).json({ error: "Missing Post ID or User ID." });
    }

    if (!reactionType || (reactionType !== 'like' && reactionType !== 'dislike')) {
        return res.status(400).json({ error: "Invalid reaction type. Must be 'like' or 'dislike'." });
    }

    try {
        const pool = await poolPromise;

        const postCheck = await pool.request()
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT 1
                FROM posts
                WHERE post_id = @PostId;
            `);

        if (postCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const checkResult = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('PostId', sql.Int, postId)
            .input('ReactionType', sql.VarChar, reactionType)
            .query(`
                SELECT 1
                FROM reactions
                WHERE user_id = @UserId
                AND post_id = @PostId
                AND comment_id IS NULL
                AND reaction_type = @ReactionType;
            `);
        
        if (checkResult.recordset.length > 0) {
            return res.status(409).json({ error: 'Conflict: Reaction already exists. Use PUT to update.' });
        }

        await pool.request()
            .input('UserId', sql.Int, userId)
            .input('PostId', sql.Int, postId)
            .input('ReactionType', sql.VarChar, reactionType)
            .query(`
                INSERT INTO reactions (user_id, post_id, reaction_type, created_at)
                VALUES (@UserId, @PostId, @ReactionType, GETDATE());
            `);

        res.status(201).json({ 
            message: 'Reaction created successfully.'
        });

    } catch (err) {
        console.error('Error creating post reaction:', err.message);
        res.status(500).json({ error: 'Failed to create post reaction.', details: err.message });
    }
};

// UPDATE POST REACTION
exports.updatePostReaction = async (req, res) => {
    const { postId } = req.params;
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
            .input('ReactionType', sql.VarChar, reactionType)
            .query(`
                UPDATE reactions 
                SET reaction_type = @ReactionType, created_at = GETDATE()
                WHERE user_id = @UserId 
                AND post_id = @PostId 
                AND comment_id IS NULL;
            `);
        console.log('Current reaction for this user on post', postId, ':', reactionType);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Reaction not found for update. Use POST to create.' });
        }
        
        res.status(200).json({ 
            message: 'Reaction updated successfully.'
        });

    } catch (err) {
        console.error('Error updating post reaction:', err.message);
        res.status(500).json({ error: 'Failed to update post reaction.', details: err.message });
    }
};

// DELETE POST REACTION
exports.deletePostReaction = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.user_id;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('PostId', sql.Int, postId)
            .query(`
                DELETE FROM reactions 
                WHERE user_id = @UserId 
                AND post_id = @PostId 
                AND comment_id IS NULL;
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Reaction not found for deletion.' });
        }
        
        res.status(200).json({ 
            message: 'Reaction deleted successfully.'
        });

    } catch (err) {
        console.error('Error deleting post reaction:', err.message);
        res.status(500).json({ error: 'Failed to delete post reaction.', details: err.message });
    }
};

// GET POST REACTION COUNTS
exports.getPostReactionCounts = async (req, res) => {
    const postIdParam = req.params?.postId; 
    
    if (!postIdParam) {
        return res.status(400).json({ error: "Missing required post ID parameter." });
    }

    const postId = parseInt(postIdParam, 10);
    if (Number.isNaN(postId) || postId <= 0) {
        return res.status(400).json({ error: "Invalid Post ID." });
    }
    
    try {
        const pool = await poolPromise;

        const postCheck = await pool.request()
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT 1
                FROM posts
                WHERE post_id = @PostId; 
            `);

        if (postCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const result = await pool.request()
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT 
                    SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) AS like_count,
                    SUM(CASE WHEN reaction_type = 'dislike' THEN 1 ELSE 0 END) AS dislike_count
                FROM reactions
                WHERE post_id = @PostId AND comment_id IS NULL;
            `);
        
        const record = result.recordset[0] || {};
        const counts = {
            like_count: parseInt(record.like_count) || 0,
            dislike_count: parseInt(record.dislike_count) || 0
        };

        res.status(200).json(counts);
    } catch (err) {
        console.error('Error fetching post reaction counts:', err.message);
        res.status(500).json({ error: 'Failed to retrieve reaction counts.', details: err.message });
    }
};

// HANDLE POST REACTION
exports.handlePostReaction = async (req, res) => {
    const postId  = req.params?.postId;
    const userId = req.user.user_id;
    const reaction_type = req.body.reaction_type;

    if (!postId || !userId) {
        return res.status(400).json({ error: "Missing Post ID or User ID." });
    }
    try {
        const pool = await poolPromise;

        const existing = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT TOP 1 reaction_type 
                FROM reactions 
                WHERE user_id = @UserId AND post_id = @PostId AND comment_id IS NULL;
            `);

        const currentReaction = existing.recordset[0]?.reaction_type || null;
        
        if (currentReaction === reaction_type) {
            return exports.deletePostReaction(req, res);
        }
        else if (currentReaction !== null && currentReaction !== reaction_type) {
            return exports.updatePostReaction(req, res);
        }
        else if (currentReaction === null) {
            return exports.createPostReaction(req, res);
        }
        
        return res.status(400).json({ error: "Invalid reaction type or no change." });

    } catch (err) {
        console.error('Error handling post reaction:', err.message);
        res.status(500).json({ error: 'Failed to handle post reaction.', details: err.message });
    }
};