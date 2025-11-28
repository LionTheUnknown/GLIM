const { pool } = require('../db');

// GET ALL POSTS
exports.getAllPosts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT posts.post_id, posts.content_text, posts.category_id, 
                users.display_name AS author_name, 
                posts.created_at
            FROM posts
            JOIN users ON posts.author_id = users.user_id 
            ORDER BY posts.created_at DESC
        `);

        const formattedPosts = result.rows.map(record => ({
            post_id: record.post_id,
            author_name: record.author_name,
            content_text: record.content_text,
            category: record.category_id, 
        }));
        
        res.status(200).json(formattedPosts);
        
    } catch (err) {
        console.error('Error fetching posts:', err.message);
        res.status(500).json({ error: 'Failed to retrieve posts', details: err.message });
    }
};

// CREATE POST
exports.createPost = async (req, res) => {
    const authorId = req.user.user_id;
    const { content_text, category_id, media_url } = req.body;

    if (!content_text || content_text.trim().length === 0) {
        return res.status(400).json({ error: 'Something needs to be written for the post to be made' });
    }

    try {
        await pool.query(`
            INSERT INTO posts (author_id, category_id, content_text, media_url) 
            VALUES ($1, $2, $3, $4)
        `, [authorId, category_id ? parseInt(category_id) : null, content_text, media_url || null]);

        res.status(201).json({ message: 'Post created successfully.' });

    } catch (err) {
        console.error('Error creating post:', err.message);
        res.status(500).json({ error: 'Failed to create post.', details: err.message });
    }
};

// UPDATE POST
exports.updatePost = async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user?.user_id; 
    const { content_text, category_id, media_url } = req.body;

    if (!content_text) {
        return res.status(400).json({ error: 'Content text cannot be empty during update.' });
    }

    try {
        const result = await pool.query(`
            UPDATE posts 
            SET 
                content_text = $1, 
                category_id = $2,
                media_url = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE post_id = $4 AND author_id = $5
        `, [content_text, category_id || null, media_url || null, postId, userId]);

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

// HELPER: Format post data
const formatPost = (post, reactionCounts, userReactionType) => {
    if (!post) return null;

    const {
        post_id,
        content_text,
        media_url,
        author_id,
        display_name: author_name,
        created_at,
        category_id,
    } = post;

    return {
        post_id,
        content_text,
        media_url,
        author_id,
        author_name,
        created_at,
        category_id,
        reaction_counts: reactionCounts,
        user_reaction_type: userReactionType,
    };
};

// HELPER: Fetch post metadata (reactions)
const fetchPostMetadata = async (postId, userId) => {
    try {
        const countsResult = await pool.query(`
            SELECT 
                COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) AS like_count,
                COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) AS dislike_count
            FROM reactions
            WHERE post_id = $1 AND comment_id IS NULL
        `, [postId]);

        const record = countsResult.rows[0] || {};
        const counts = {
            like_count: parseInt(record.like_count) || 0,
            dislike_count: parseInt(record.dislike_count) || 0
        };

        let userReaction = null;
        if (userId) {
            const userResult = await pool.query(`
                SELECT reaction_type 
                FROM reactions 
                WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL
                LIMIT 1
            `, [userId, postId]);
            
            userReaction = userResult.rows[0]?.reaction_type || null;
        }

        return { counts, userReaction };

    } catch (err) {
        console.error(`Error fetching metadata for post ${postId}:`, err.message);
        return { counts: { like_count: 0, dislike_count: 0 }, userReaction: null };
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
                p.created_at, p.category_id, u.username AS display_name
            FROM posts p
            INNER JOIN users u ON p.author_id = u.user_id
            WHERE p.post_id = $1
        `, [postId]);

        const post = result.rows[0];
        if (!post) {
            return res.status(404).json({ message: `Post with ID ${postId} not found.` });
        }

        const metadata = await fetchPostMetadata(postId, userId);
        res.status(200).json(formatPost(post, metadata.counts, metadata.userReaction));

    } catch (err) {
        console.error(`Error fetching post by ID ${postId}:`, err.message);
        res.status(500).json({ error: 'Failed to retrieve post details.', details: err.message });
    }
};

// GET POST LIST BY CATEGORY
exports.getPostsByCategory = async (req, res) => {
    const categoryId = req.params.categoryId; 

    try {
        const result = await pool.query(`
            SELECT p.post_id, p.content_text, p.media_url, p.created_at,
                   u.display_name AS author_name, c.category_name
            FROM posts p
            JOIN users u ON p.author_id = u.user_id 
            JOIN categories c ON p.category_id = c.category_id
            WHERE p.category_id = $1
            ORDER BY p.created_at DESC
        `, [categoryId]);

        const formattedPosts = result.rows.map(record => ({
            post_id: record.post_id,
            author_name: record.author_name,
            content_text: record.content_text,
            category_name: record.category_name,
            media_url: record.media_url,
            created_at: record.created_at,
        }));
        
        res.status(200).json(formattedPosts);
        
    } catch (err) {
        console.error('Error fetching posts by category:', err.message);
        res.status(500).json({ error: 'Failed to retrieve posts.', details: err.message });
    }
};

