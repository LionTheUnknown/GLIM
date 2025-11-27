const { pool } = require('../db');

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
        // Check if post exists
        const postCheck = await pool.query(
            'SELECT 1 FROM posts WHERE post_id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Get user's reaction
        const result = await pool.query(`
            SELECT reaction_type 
            FROM reactions 
            WHERE post_id = $1 
            AND user_id = $2 
            AND comment_id IS NULL
            LIMIT 1
        `, [postId, userId]);

        const userReactionType = result.rows[0]?.reaction_type || null;

        res.status(200).json({ user_reaction_type: userReactionType });

    } catch (err) {
        console.error('Error fetching user post reaction:', err.message);
        res.status(500).json({ error: 'Failed to retrieve user reaction status.', details: err.message });
    }
};

// CREATE POST REACTION
exports.createPostReaction = async (req, res) => {
    const postId = req.params?.postId;
    const userId = req.user.user_id;
    const reactionType = req.body.reaction_type;

    if (!postId || !userId) {
        return res.status(400).json({ error: "Missing Post ID or User ID." });
    }

    if (!reactionType || (reactionType !== 'like' && reactionType !== 'dislike')) {
        return res.status(400).json({ error: "Invalid reaction type. Must be 'like' or 'dislike'." });
    }

    try {
        // Check if post exists
        const postCheck = await pool.query(
            'SELECT 1 FROM posts WHERE post_id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Check if reaction already exists
        const checkResult = await pool.query(`
            SELECT 1 FROM reactions
            WHERE user_id = $1
            AND post_id = $2
            AND comment_id IS NULL
            AND reaction_type = $3
        `, [userId, postId, reactionType]);
        
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ error: 'Conflict: Reaction already exists. Use PUT to update.' });
        }

        // Insert new reaction
        await pool.query(`
            INSERT INTO reactions (user_id, post_id, reaction_type, created_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [userId, postId, reactionType]);

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
        const result = await pool.query(`
            UPDATE reactions 
            SET reaction_type = $1, created_at = CURRENT_TIMESTAMP
            WHERE user_id = $2 
            AND post_id = $3 
            AND comment_id IS NULL
        `, [reactionType, userId, postId]);

        console.log('Current reaction for this user on post', postId, ':', reactionType);
        
        if (result.rowCount === 0) {
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
        const result = await pool.query(`
            DELETE FROM reactions 
            WHERE user_id = $1 
            AND post_id = $2 
            AND comment_id IS NULL
        `, [userId, postId]);

        if (result.rowCount === 0) {
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
        // Check if post exists
        const postCheck = await pool.query(
            'SELECT 1 FROM posts WHERE post_id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Get reaction counts
        const result = await pool.query(`
            SELECT 
                COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) AS like_count,
                COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) AS dislike_count
            FROM reactions
            WHERE post_id = $1 AND comment_id IS NULL
        `, [postId]);
        
        const record = result.rows[0] || {};
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

// HANDLE POST REACTION (Smart toggle/update)
exports.handlePostReaction = async (req, res) => {
    const postId = req.params?.postId;
    const userId = req.user.user_id;
    const reaction_type = req.body.reaction_type;

    if (!postId || !userId) {
        return res.status(400).json({ error: "Missing Post ID or User ID." });
    }

    try {
        // Get existing reaction
        const existing = await pool.query(`
            SELECT reaction_type 
            FROM reactions 
            WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL
            LIMIT 1
        `, [userId, postId]);

        const currentReaction = existing.rows[0]?.reaction_type || null;
        
        // Toggle: If same reaction, delete it
        if (currentReaction === reaction_type) {
            return exports.deletePostReaction(req, res);
        }
        // Update: If different reaction exists
        else if (currentReaction !== null && currentReaction !== reaction_type) {
            return exports.updatePostReaction(req, res);
        }
        // Create: If no reaction exists
        else if (currentReaction === null) {
            return exports.createPostReaction(req, res);
        }
        
        return res.status(400).json({ error: "Invalid reaction type or no change." });

    } catch (err) {
        console.error('Error handling post reaction:', err.message);
        res.status(500).json({ error: 'Failed to handle post reaction.', details: err.message });
    }
};

