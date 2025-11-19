const { poolPromise, sql } = require('../db');
const reactionController = require('./post_reaction_controller');
// GET ALL POSTS
exports.getAllPosts = async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultSet = await pool.request().query(`
            SELECT posts.post_id, posts.content_text, posts.category_id, 
                users.display_name AS author_name, 
                posts.created_at
            FROM posts
            JOIN users ON posts.author_id = users.user_id 
            ORDER BY posts.created_at DESC;
        `);

        const formattedPosts = resultSet.recordset.map(record => ({
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

    const { content_text, category_id, media_url} = req.body;

    if(!content_text || content_text.trim().length === 0){
        return res.status(400).json({ error: 'Something needs to be written for the post to be made' });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request()
        .input('authorId', sql.Int, authorId) 
        .input('categoryId', sql.Int, category_id ? parseInt(category_id) : null)
        .input('contentText', sql.NVarChar(4000), content_text)
        .input('mediaUrl', sql.VarChar(255), media_url || null);

        await request.query(`
            INSERT INTO posts (author_id, category_id, content_text, media_url) 
            VALUES (@authorId, @categoryId, @contentText, @mediaUrl)
        `);

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
        const pool = await poolPromise;
        const result = await pool.request()
            .input('PostId', sql.Int, postId)
            .input('UserId', sql.Int, userId)
            .input('ContentText', sql.NVarChar(4000), content_text)
            .input('CategoryId', sql.Int, category_id || null)
            .input('MediaUrl', sql.VarChar(255), media_url || null)
            .query(`
                UPDATE posts 
                SET 
                    content_text = @ContentText, 
                    category_id = @CategoryId,
                    media_url = @MediaUrl
                WHERE post_id = @PostId AND author_id = @UserId;
            `);

        if (result.rowsAffected[0] === 0) {
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
        const pool = await poolPromise;
        // NEED TO DELETE SINCE IT HAS FK WITH REACTIONS
        await pool.request()
            .input('PostId', sql.Int, postId)
            .query(`
                DELETE FROM reactions
                WHERE post_id = @PostId 
                AND comment_id IS NULL;
            `);
        // THIS ACTUALLY DELETES THE POST NOW FR
        const result = await pool.request()
            .input('PostId', sql.Int, postId)
            .input('AuthorId', sql.Int, authorId)
            .query(`
                DELETE FROM posts
                WHERE post_id = @PostId 
                AND author_id = @AuthorId;
            `);
        
        const rowsAffected = result.rowsAffected[0];
        
        if (rowsAffected === 0) {
            return res.status(403).json({ message: 'Forbidden: Post not found or you are not the author.' });
        }

        res.status(200).json({ message: 'Post and all associated data deleted successfully.' });

    } catch (err) {
        console.error('Error deleting post:', err.message);
        res.status(500).json({ error: 'Failed to delete post.', details: err.message });
    }
};

/*exports.deletePost = async (req, res) => {
    const postId = req.params.postId;   
    const userId = req.user.user_id;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('PostId', sql.Int, postId)
            .input('UserId', sql.Int, userId)
            .query(`
                DELETE FROM posts 
                WHERE post_id = @PostId AND author_id = @UserId;
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Post not found or user is not the author.' });
        }

        res.status(200).json({ message: 'Post deleted successfully.' });

    } catch (err) {
        console.error('Error deleting post:', err.message);
        res.status(500).json({ error: 'Failed to delete post.' });
    }
};*/

/*exports.deletePost = async (req, res) => {
    const postId = req.params?.postId;
    const authorId = req.user.user_id;

    if (!postId) {
        return res.status(400).json({ error: "Post ID is required." });
    }

    try {
        const pool = await poolPromise;
        await reactionController.deletePostReaction(req, res);

        const result = await pool.request()
            .input('PostId', sql.Int, postId)
            .input('AuthorId', sql.Int, authorId)
            .query(`
                DELETE FROM posts
                WHERE post_id = @PostId 
                AND author_id = @AuthorId;
            `);
        
        const rowsAffected = result.rowsAffected[0];
        
        if (rowsAffected === 0) {
            return res.status(403).json({ message: 'Forbidden: Post not found or you are not the author.' });
        }

        res.status(200).json({ message: 'Post and all associated data deleted successfully.' });

    } catch (err) {
        console.error('Error deleting post:', err.message);
        res.status(500).json({ error: 'Failed to delete post.', details: err.message });
    }
};
*/
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

// FETCHES POST DATA AND STUFF
const fetchPostMetadata = async (pool, postId, userId) => {
    try {
        const countsResult = await pool.request()
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT 
                    SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) AS like_count,
                    SUM(CASE WHEN reaction_type = 'dislike' THEN 1 ELSE 0 END) AS dislike_count
                FROM reactions
                WHERE post_id = @PostId AND comment_id IS NULL;
            `);

        const record = countsResult.recordset[0] || {};
        const counts = {
            like_count: parseInt(record.like_count) || 0,
            dislike_count: parseInt(record.dislike_count) || 0
        };

        let userReaction = null;
        if (userId) {
            const userResult = await pool.request()
                .input('UserId', sql.Int, userId)
                .input('PostId', sql.Int, postId)
                .query(`
                    SELECT TOP 1 reaction_type 
                    FROM reactions 
                    WHERE user_id = @UserId AND post_id = @PostId
                `);
            userReaction = userResult.recordset[0]?.reaction_type || null;
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
    const userId = req.user?.user_id;

    try {
        const pool = await poolPromise;
        const { recordset } = await pool.request()
            .input('PostId', sql.Int, postId)
            .query(`
                SELECT 
                    p.post_id, p.content_text, p.media_url, p.author_id, 
                    p.created_at, p.category_id, u.username AS display_name
                FROM posts p
                INNER JOIN users u ON p.author_id = u.user_id
                WHERE p.post_id = @PostId
            `);

        const post = recordset[0];
        if (!post) return res.status(404).json({ message: `Post with ID ${postId} not found.` });

        const metadata = await fetchPostMetadata(pool, postId, userId);
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
        const pool = await poolPromise;
        const resultSet = await pool.request()
            .input('CategoryId', sql.Int, categoryId)
            .query(`
                SELECT p.post_id, p.content_text, p.media_url, p.created_at,
                       u.display_name AS author_name, c.category_name
                FROM posts p
                JOIN users u ON p.author_id = u.user_id 
                JOIN categories c ON p.category_id = c.category_id
                WHERE p.category_id = @CategoryId
                ORDER BY p.created_at DESC;
            `);

        const formattedPosts = resultSet.recordset.map(record => ({
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