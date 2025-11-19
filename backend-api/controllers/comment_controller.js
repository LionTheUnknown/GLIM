const { poolPromise, sql } = require('../db');

// make a method for checking if post id is valid


/*
// GET ALL COMMENTS
exports.getAllComments = async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultSet = await pool.request().query(`
            SELECT c.comment_id, c.post_id, c.content_text, c.parent_comment_id,
                u.display_name AS author_name, 
                c.created_at
            FROM comments c
            JOIN users u ON c.author_id = u.user_id 
            ORDER BY c.created_at DESC;
        `);

        const formattedComments = resultSet.recordset.map(record => ({
            comment_id: record.comment_id,
            post_id: record.post_id,
            content_text: record.content_text,
            author_name: record.author_name,
            created_at: record.created_at, 
            parent_comment_id: record.parent_comment_id,
        }));
        
        res.status(200).json(formattedComments);
        
    } catch (err) {
        console.error('Error fetching comments:', err.message);
        res.status(500).json({ error: 'Failed to retrieve comments', details: err.message });
    }
};
*/

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
        const pool = await poolPromise;

        const postCheck = await pool.request()
            .input('postId', sql.Int, postId)
            .query('SELECT post_id FROM posts WHERE post_id = @postId;');

        if (postCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        if (parentId != null) {
            const parentCheck = await pool.request()
                .input('parentId', sql.Int, parentId)
                .query('SELECT comment_id, post_id FROM comments WHERE comment_id = @parentId;');

            if (parentCheck.recordset.length === 0) {
                return res.status(400).json({ error: 'Parent comment not found.' });
            }

            const parentComment = parentCheck.recordset[0];
            if (parentComment.post_id !== postId) {
                return res.status(400).json({ error: 'Parent comment does not belong to the specified post.' });
            }
        }

        const insertResult = await pool.request()
            .input('postId', sql.Int, postId)
            .input('authorId', sql.Int, authorId)
            .input('contentText', sql.NVarChar(4000), content_text)
            .input('parentCommentId', sql.Int, parentId)
            .query(`
                INSERT INTO comments (post_id, author_id, content_text, parent_comment_id)
                OUTPUT INSERTED.comment_id, INSERTED.created_at
                VALUES (@postId, @authorId, @contentText, @parentCommentId);
            `);

        const inserted = insertResult.recordset[0];
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
        const pool = await poolPromise;
        const result = await pool.request()
            .input('postId', sql.Int, postId)
            .input('commentId', sql.Int, commentId)
            .query(`
                SELECT c.comment_id, c.post_id, c.content_text, c.parent_comment_id,
                    u.display_name AS author_name, 
                    c.created_at
                FROM comments c
                JOIN users u ON c.author_id = u.user_id 
                WHERE c.post_id = @postId AND c.comment_id = @commentId;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        const comment = result.recordset[0];
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

// UPDATE POST
exports.updateComment = async (req, res) => {
    const commentId = req.params.commentId; 
    const postId = req.params.postId; 
    const userId = req.user.user_id;
    const { content_text } = req.body;

    if (!content_text || content_text.trim().length === 0) {
        return res.status(400).json({ error: 'Comment text cannot be empty during update.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CommentId', sql.Int, commentId)
            .input('PostId', sql.Int, postId)
            .input('UserId', sql.Int, userId)
            .input('ContentText', sql.NVarChar(4000), content_text) 
            .query(`
                UPDATE comments  
                SET 
                    content_text = @ContentText
                WHERE comment_id = @CommentId 
                  AND post_id = @PostId 
                  AND author_id = @UserId; 
            `);

        if (result.rowsAffected[0] === 0) {
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

// DELETE POST 
exports.deleteComment = async (req, res) => {
    const commentId = req.params.commentId;
    const postId = req.params.postId;
    const userId = req.user.user_id;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CommentId', sql.Int, commentId)
            .input('PostId', sql.Int, postId)
            .input('UserId', sql.Int, userId)
            .query(`
                DELETE FROM comments 
                WHERE comment_id = @CommentId 
                  AND post_id = @PostId
                  AND author_id = @UserId; 
            `);

        if (result.rowsAffected[0] === 0) {
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
        const pool = await poolPromise;

        const postCheck = await pool.request()
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT 1
                FROM posts
                WHERE id = @PostId; 
            `);

        if (postCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const resultSet = await pool.request()
            .input('postId', sql.Int, postId)
            .query(`
                SELECT c.comment_id, c.post_id, c.content_text, c.parent_comment_id,
                    u.display_name AS author_name, 
                    c.created_at
                FROM comments c
                JOIN users u ON c.author_id = u.user_id 
                WHERE c.post_id = @postId
                ORDER BY c.created_at ASC;
            `);

        const formattedComments = resultSet.recordset.map(record => ({
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
