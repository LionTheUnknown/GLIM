const { pool, getClient } = require('../db');
const { enrichPostsWithMetadata, fetchPostReactionMetadata, formatPost, fetchBatchCategories } = require('../utils/postHelpers');

// GET ALL POSTS
exports.getAllPosts = async (req, res) => {
    const userId = req.user ? req.user.user_id : null;
    
    try {
        const result = await pool.query(`
            SELECT DISTINCT posts.post_id, posts.content_text,
                users.display_name AS author_name, users.avatar_url AS author_avatar_url,
                posts.created_at, posts.expires_at, posts.media_url, posts.pinned
            FROM posts
            JOIN users ON posts.author_id = users.user_id 
            WHERE posts.expires_at IS NULL OR posts.expires_at > CURRENT_TIMESTAMP
            ORDER BY posts.pinned DESC, posts.created_at DESC
        `);

        if (result.rows.length === 0) {
            return res.status(200).json([]);
        }

        const formattedPosts = await enrichPostsWithMetadata(result.rows, userId);
        res.status(200).json(formattedPosts);
        
    } catch (err) {
        console.error('Error fetching posts:', err.message);
        res.status(500).json({ error: 'Failed to retrieve posts', details: err.message });
    }
};

// CREATE POST
exports.createPost = async (req, res) => {
    const authorId = req.user.user_id;
    const { content_text, category_ids, media_url, expiration_duration } = req.body;

    if (!content_text || content_text.trim().length === 0) {
        return res.status(400).json({ error: 'Something needs to be written for the post to be made' });
    }

    if (!expiration_duration) {
        return res.status(400).json({ error: 'Post duration is required.' });
    }

    const durationMinutes = parseInt(expiration_duration, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({ error: 'Post duration must be a valid number greater than 0.' });
    }

    const allowedDurations = [1, 60, 1440];
    if (!allowedDurations.includes(durationMinutes)) {
        return res.status(400).json({ error: 'Invalid post duration. Allowed values are: 1 minute, 1 hour, or 1 day.' });
    }

    let client;
    
    try {
        client = await getClient();
        await client.query('BEGIN');
        
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
        
        const validCategoryIds = Array.isArray(category_ids) 
            ? category_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0)
            : [];

        const result = await client.query(`
            INSERT INTO posts (author_id, content_text, media_url, expires_at) 
            VALUES ($1, $2, $3, $4)
            RETURNING post_id
        `, [authorId, content_text, media_url || null, expiresAt]);

        const postId = result.rows[0].post_id;

        if (validCategoryIds.length > 0) {
            for (const catId of validCategoryIds) {
                await client.query(`
                    INSERT INTO post_categories (post_id, category_id)
                    VALUES ($1, $2)
                    ON CONFLICT (post_id, category_id) DO NOTHING
                `, [postId, catId]);
            }
        }

        await client.query('COMMIT');
        client.release();
        
        res.status(201).json({ message: 'Post created successfully.' });

    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('Error rolling back transaction:', rollbackErr.message);
            } finally {
                client.release();
            }
        }
        console.error('Error creating post:', err.message);
        res.status(500).json({ error: 'Failed to create post.', details: err.message });
    }
};

// UPDATE POST
exports.updatePost = async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user?.user_id; 
    const { content_text, media_url } = req.body;

    if (!content_text) {
        return res.status(400).json({ error: 'Content text cannot be empty during update.' });
    }

    try {
        const result = await pool.query(`
            UPDATE posts 
            SET 
                content_text = $1, 
                media_url = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE post_id = $3 AND author_id = $4
        `, [content_text, media_url || null, postId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Post not found or user is not the author.' });
        }

        res.status(200).json({ message: 'Post updated successfully.' });

    } catch (err) {
        console.error('Error updating post:', err.message);
        res.status(500).json({ error: 'Failed to update post.' });
    }
};

// DELETE POST
exports.deletePost = async (req, res) => {
    const postId = req.params?.postId;
    const authorId = req.user.user_id;

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
            WHERE post_id = $1 AND author_id = $2
        `, [postId, authorId]);
        
        if (result.rowCount === 0) {
            return res.status(403).json({ message: 'Forbidden: Post not found or you are not the author.' });
        }

        res.status(200).json({ message: 'Post and all associated data deleted successfully.' });

    } catch (err) {
        console.error('Error deleting post:', err.message);
        res.status(500).json({ error: 'Failed to delete post.', details: err.message });
    }
};

// GET POST BY ID
exports.getPostById = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user ? req.user.user_id : null;

    try {
        const result = await pool.query(`
            SELECT 
                p.post_id, p.content_text, p.media_url, p.author_id, 
                p.created_at, p.expires_at, p.pinned, 
                u.display_name AS author_name, u.avatar_url AS author_avatar_url
            FROM posts p
            INNER JOIN users u ON p.author_id = u.user_id
            WHERE p.post_id = $1 AND (p.expires_at IS NULL OR p.expires_at > CURRENT_TIMESTAMP)
        `, [postId]);

        const post = result.rows[0];
        if (!post) {
            return res.status(404).json({ error: `Post with ID ${postId} not found.` });
        }

        const categoriesMap = await fetchBatchCategories([parseInt(postId)]);
        post.categories = categoriesMap.get(parseInt(postId)) || [];

        const metadata = await fetchPostReactionMetadata(postId, userId);
        res.status(200).json(formatPost(post, metadata.counts, metadata.userReaction));

    } catch (err) {
        console.error(`Error fetching post by ID ${postId}:`, err.message);
        res.status(500).json({ error: 'Failed to retrieve post details.', details: err.message });
    }
};

// GET POST LIST BY CATEGORY
exports.getPostsByCategory = async (req, res) => {
    const categoryId = req.params.categoryId; 
    const userId = req.user ? req.user.user_id : null;

    try {
        const result = await pool.query(`
            SELECT DISTINCT p.post_id, p.content_text, p.media_url, p.created_at, p.expires_at, p.pinned,
                   u.display_name AS author_name, u.avatar_url AS author_avatar_url
            FROM posts p
            JOIN users u ON p.author_id = u.user_id 
            JOIN post_categories pc ON p.post_id = pc.post_id
            WHERE pc.category_id = $1 AND (p.expires_at IS NULL OR p.expires_at > CURRENT_TIMESTAMP)
            ORDER BY p.pinned DESC, p.created_at DESC
        `, [categoryId]);

        if (result.rows.length === 0) {
            return res.status(200).json([]);
        }

        const formattedPosts = await enrichPostsWithMetadata(result.rows, userId);
        res.status(200).json(formattedPosts);
        
    } catch (err) {
        console.error('Error fetching posts by category:', err.message);
        res.status(500).json({ error: 'Failed to retrieve posts.', details: err.message });
    }
};

