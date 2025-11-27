const { pool } = require('../db');

// CREATE COMMENT
exports.createComment = async (req, res) => {
    const authorId = req.user.user_id;
    const postIdParam = req.params.postId;
    const { content_text, parent_comment_id } = req.body;

    if (!content_text || content_text.trim().length === 0) {
        return res.status(400).json({ error: 'Something needs to be written for the comment to be made' });
    }

    const postId = parseInt(postIdParam, 10);
    if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid postId parameter.' });
    }

    const parentId = parent_comment_id == null ? null : parseInt(parent_comment_id, 10);
    if (parent_comment_id != null && isNaN(parentId)) {
        return res.status(400).json({ error: 'Invalid parent_comment_id.' });
    }

    try {
        // Check if post exists
        const postCheck = await pool.query(
            'SELECT post_id FROM posts WHERE post_id = $1',
            [postId]
        );

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Check if parent comment exists and belongs to the same post
        if (parentId != null) {
            const parentCheck = await pool.query(
                'SELECT comment_id, post_id FROM comments WHERE comment_id = $1',
                [parentId]
            );

            if (parentCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Parent comment not found.' });
            }

            const parentComment = parentCheck.rows[0];
            if (parentComment.post_id !== postId) {
                return res.status(400).json({ 
                    error: 'Parent comment does not belong to the specified post.' 
                });
            }
        }

        // Insert the comment and return the created data
        const insertResult = await pool.query(`
            INSERT INTO comments (post_id, author_id, content_text, parent_comment_id)
            VALUES ($1, $2, $3, $4)
            RETURNING comment_id, created_at
        `, [postId, authorId, content_text, parentId]);

        const inserted = insertResult.rows[0];
        res.status(201).json({
            message: 'Comment created successfully.',
            comment_id: inserted.comment_id,
            created_at: inserted.created_at
        });

    } catch (err) {
        console.error('Error creating comment:', err.message);
        res.status(500).json({ error: 'Failed to create comment.', details: err.message });
    }
};

// GET SINGLE COMMENT BY postId AND commentId
exports.getComment = async (req, res) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    try {
        const result = await pool.query(`
            SELECT c.comment_id, c.post_id, c.content_text, c.parent_comment_id,
                u.display_name AS author_name, 
                c.created_at
            FROM comments c
            JOIN users u ON c.author_id = u.user_id 
            WHERE c.post_id = $1 AND c.comment_id = $2
        `, [postId, commentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        const comment = result.rows[0];
        res.status(200).json({
            comment_id: comment.comment_id,
            post_id: comment.post_id,
            content_text: comment.content_text,
            author_name: comment.author_name,
            created_at: comment.created_at,
            parent_comment_id: comment.parent_comment_id,
        });
    } catch (err) {
        console.error('Error fetching comment:', err.message);
        res.status(500).json({ error: 'Failed to retrieve comment', details: err.message });
    }
};

// UPDATE COMMENT
exports.updateComment = async (req, res) => {
    const commentId = req.params.commentId; 
    const postId = req.params.postId; 
    const userId = req.user.user_id;
    const { content_text } = req.body;

    if (!content_text || content_text.trim().length === 0) {
        return res.status(400).json({ error: 'Comment text cannot be empty during update.' });
    }

    try {
        const result = await pool.query(`
            UPDATE comments  
            SET 
                content_text = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE comment_id = $2 
              AND post_id = $3 
              AND author_id = $4
        `, [content_text, commentId, postId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                error: 'Comment not found, user is not the author, or comment does not belong to this post.' 
            });
        }

        res.status(200).json({ message: 'Comment updated successfully.' });

    } catch (err) {
        console.error('Error updating comment:', err.message);
        res.status(500).json({ error: 'Failed to update comment.' });
    }
};

// DELETE COMMENT
exports.deleteComment = async (req, res) => {
    const commentId = req.params.commentId;
    const postId = req.params.postId;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(`
            DELETE FROM comments 
            WHERE comment_id = $1 
              AND post_id = $2
              AND author_id = $3
        `, [commentId, postId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                error: 'Comment not found, user is not the author, or comment does not belong to this post.' 
            });
        }

        res.status(200).json({ message: 'Comment deleted successfully.' });

    } catch (err) {
        console.error('Error deleting comment:', err.message);
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
};

// GET ALL COMMENTS FOR A POST
exports.getCommentsByPost = async (req, res) => {
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

        // Get all comments for the post
        const result = await pool.query(`
            SELECT c.comment_id, c.post_id, c.content_text, c.parent_comment_id,
                u.display_name AS author_name, 
                c.created_at
            FROM comments c
            JOIN users u ON c.author_id = u.user_id 
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
        `, [postId]);

        const formattedComments = result.rows.map(record => ({
            comment_id: record.comment_id,
            post_id: record.post_id,
            content_text: record.content_text,
            author_name: record.author_name,
            created_at: record.created_at, 
            parent_comment_id: record.parent_comment_id,
        }));
        
        res.status(200).json(formattedComments);
        
    } catch (err) {
        console.error('Error fetching comments for post:', err.message);
        res.status(500).json({ error: 'Failed to retrieve comments for post', details: err.message });
    }
};

