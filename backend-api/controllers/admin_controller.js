const { pool } = require('../db');

// DELETE ANY POST (admin only)
exports.deleteAnyPost = async (req, res) => {
    const postId = req.params.postId;

    if (!postId) {
        return res.status(400).json({ error: "Post ID is required." });
    }

    try {
        await pool.query(`
            DELETE FROM reactions
            WHERE post_id = $1 AND comment_id IS NULL
        `, [postId]);

        const result = await pool.query(`
            DELETE FROM posts
            WHERE post_id = $1
        `, [postId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        res.status(200).json({ message: 'Post and all associated data deleted successfully.' });

    } catch (err) {
        console.error('Error deleting post:', err.message);
        res.status(500).json({ error: 'Failed to delete post.', details: err.message });
    }
};

// REVIVE POST (extend expiration)
exports.revivePost = async (req, res) => {
    const postId = req.params.postId;
    const { duration_minutes } = req.body;

    if (!postId) {
        return res.status(400).json({ error: "Post ID is required." });
    }

    if (!duration_minutes || isNaN(duration_minutes) || duration_minutes <= 0) {
        return res.status(400).json({ error: "Valid duration_minutes is required." });
    }

    const allowedDurations = [1, 60, 1440];
    if (!allowedDurations.includes(parseInt(duration_minutes))) {
        return res.status(400).json({ error: 'Invalid duration. Allowed values are: 1, 60, or 1440 minutes.' });
    }

    try {
        const newExpiresAt = new Date(Date.now() + duration_minutes * 60 * 1000);

        const result = await pool.query(`
            UPDATE posts
            SET expires_at = $1, updated_at = CURRENT_TIMESTAMP
            WHERE post_id = $2
            RETURNING post_id, expires_at
        `, [newExpiresAt, postId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        res.status(200).json({ 
            message: 'Post revived successfully.',
            expires_at: result.rows[0].expires_at
        });

    } catch (err) {
        console.error('Error reviving post:', err.message);
        res.status(500).json({ error: 'Failed to revive post.', details: err.message });
    }
};

// PIN/UNPIN POST
exports.togglePinPost = async (req, res) => {
    const postId = req.params.postId;

    if (!postId) {
        return res.status(400).json({ error: "Post ID is required." });
    }

    try {
        const currentPost = await pool.query(`
            SELECT pinned FROM posts WHERE post_id = $1
        `, [postId]);

        if (currentPost.rowCount === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const newPinnedValue = !currentPost.rows[0].pinned;

        const result = await pool.query(`
            UPDATE posts
            SET pinned = $1, updated_at = CURRENT_TIMESTAMP
            WHERE post_id = $2
            RETURNING post_id, pinned
        `, [newPinnedValue, postId]);

        res.status(200).json({ 
            message: newPinnedValue ? 'Post pinned successfully.' : 'Post unpinned successfully.',
            pinned: result.rows[0].pinned
        });

    } catch (err) {
        console.error('Error toggling pin:', err.message);
        res.status(500).json({ error: 'Failed to toggle pin.', details: err.message });
    }
};

// DELETE ANY COMMENT (admin only)
exports.deleteAnyComment = async (req, res) => {
    const { postId, commentId } = req.params;

    if (!postId || !commentId) {
        return res.status(400).json({ error: "Post ID and Comment ID are required." });
    }

    try {
        await pool.query(`
            DELETE FROM reactions
            WHERE comment_id = $1
        `, [commentId]);

        await pool.query(`
            DELETE FROM comments
            WHERE parent_comment_id = $1 AND post_id = $2
        `, [commentId, postId]);

        const result = await pool.query(`
            DELETE FROM comments
            WHERE comment_id = $1 AND post_id = $2
        `, [commentId, postId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        res.status(200).json({ message: 'Comment deleted successfully.' });

    } catch (err) {
        console.error('Error deleting comment:', err.message);
        res.status(500).json({ error: 'Failed to delete comment.', details: err.message });
    }
};


