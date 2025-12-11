const { pool } = require('../db');
const { fetchPostReactionMetadata } = require('../utils/postHelpers');

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
        const postCheck = await pool.query(
            'SELECT 1 FROM posts WHERE post_id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

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
        const postCheck = await pool.query(
            'SELECT 1 FROM posts WHERE post_id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

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

        await pool.query(`
            INSERT INTO reactions (user_id, post_id, reaction_type, created_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [userId, postId, reactionType]);

        // Return updated reaction state
        const metadata = await fetchPostReactionMetadata(postId, userId);
        res.status(201).json({ 
            message: 'Reaction created successfully.',
            reaction_counts: metadata.counts,
            user_reaction_type: metadata.userReaction
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

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Reaction not found for update. Use POST to create.' });
        }
        
        // Return updated reaction state
        const metadata = await fetchPostReactionMetadata(postId, userId);
        res.status(200).json({ 
            message: 'Reaction updated successfully.',
            reaction_counts: metadata.counts,
            user_reaction_type: metadata.userReaction
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
        
        // Return updated reaction state
        const metadata = await fetchPostReactionMetadata(postId, userId);
        res.status(200).json({ 
            message: 'Reaction deleted successfully.',
            reaction_counts: metadata.counts,
            user_reaction_type: metadata.userReaction
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
        const postCheck = await pool.query(
            'SELECT 1 FROM posts WHERE post_id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

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

// Helper function to adjust post expiration time
const adjustPostExpiration = async (postId, hoursToAdd) => {
    try {
        // Get current expiration time
        const postResult = await pool.query(`
            SELECT expires_at 
            FROM posts 
            WHERE post_id = $1
        `, [postId]);

        if (postResult.rows.length === 0) {
            return null;
        }

        const currentExpiresAt = postResult.rows[0].expires_at;
        if (!currentExpiresAt) {
            return null;
        }

        // Calculate new expiration time
        const currentTime = new Date(currentExpiresAt);
        const newExpiresAt = new Date(currentTime.getTime() + hoursToAdd * 60 * 60 * 1000);

        // Ensure expiration is not in the past
        const now = new Date();
        if (newExpiresAt <= now) {
            // If new expiration would be in the past, set it to 1 minute from now
            const minExpiresAt = new Date(now.getTime() + 60 * 1000);
            await pool.query(`
                UPDATE posts
                SET expires_at = $1, updated_at = CURRENT_TIMESTAMP
                WHERE post_id = $2
            `, [minExpiresAt, postId]);
            return minExpiresAt;
        }

        // Update expiration time
        await pool.query(`
            UPDATE posts
            SET expires_at = $1, updated_at = CURRENT_TIMESTAMP
            WHERE post_id = $2
        `, [newExpiresAt, postId]);

        return newExpiresAt;
    } catch (err) {
        console.error('Error adjusting post expiration:', err.message);
        return null;
    }
};

// HANDLE POST REACTION
exports.handlePostReaction = async (req, res) => {
    const postId = req.params?.postId;
    const userId = req.user.user_id;
    const reaction_type = req.body.reaction_type;

    if (!postId || !userId) {
        return res.status(400).json({ error: "Missing Post ID or User ID." });
    }

    try {
        const existing = await pool.query(`
            SELECT reaction_type 
            FROM reactions 
            WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL
            LIMIT 1
        `, [userId, postId]);

        const currentReaction = existing.rows[0]?.reaction_type || null;
        
        // Determine if we're adding or removing a reaction
        let isAddingReaction = false;
        let isRemovingReaction = false;
        let isChangingReaction = false;
        
        if (currentReaction === reaction_type) {
            // Removing reaction
            isRemovingReaction = true;
        } else if (currentReaction !== null && currentReaction !== reaction_type) {
            // Changing reaction
            isChangingReaction = true;
        } else if (currentReaction === null) {
            // Adding reaction
            isAddingReaction = true;
        }

        // Adjust expiration time based on reaction
        if (isAddingReaction || isChangingReaction) {
            // Like adds 1 hour, dislike subtracts 1 hour
            const hoursToAdd = reaction_type === 'like' ? 1 : -1;
            await adjustPostExpiration(postId, hoursToAdd);
        } else if (isRemovingReaction) {
            // Removing reaction reverses the effect
            const hoursToAdd = currentReaction === 'like' ? -1 : 1;
            await adjustPostExpiration(postId, hoursToAdd);
        }

        // Handle the reaction itself
        if (currentReaction === reaction_type) {
            await pool.query(`
                DELETE FROM reactions 
                WHERE user_id = $1 
                AND post_id = $2 
                AND comment_id IS NULL
            `, [userId, postId]);
        }
        else if (currentReaction !== null && currentReaction !== reaction_type) {
            await pool.query(`
                UPDATE reactions 
                SET reaction_type = $1, created_at = CURRENT_TIMESTAMP
                WHERE user_id = $2 
                AND post_id = $3 
                AND comment_id IS NULL
            `, [reaction_type, userId, postId]);
        }
        else if (currentReaction === null) {
            await pool.query(`
                INSERT INTO reactions (user_id, post_id, reaction_type, created_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            `, [userId, postId, reaction_type]);
        } else {
            return res.status(400).json({ error: "Invalid reaction type or no change." });
        }

        // Get updated expiration time and reaction metadata
        const postResult = await pool.query(`
            SELECT expires_at 
            FROM posts 
            WHERE post_id = $1
        `, [postId]);
        const newExpiresAt = postResult.rows[0]?.expires_at || null;
        const metadata = await fetchPostReactionMetadata(postId, userId);

        // Return response with expiration
        const statusCode = currentReaction === reaction_type ? 200 : 
                          (currentReaction !== null ? 200 : 201);
        const message = currentReaction === reaction_type ? 'Reaction deleted successfully.' :
                       (currentReaction !== null ? 'Reaction updated successfully.' : 'Reaction created successfully.');

        return res.status(statusCode).json({ 
            message,
            reaction_counts: metadata.counts,
            user_reaction_type: metadata.userReaction,
            expires_at: newExpiresAt
        });

    } catch (err) {
        console.error('Error handling post reaction:', err.message);
        res.status(500).json({ error: 'Failed to handle post reaction.', details: err.message });
    }
};

