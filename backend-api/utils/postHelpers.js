const { pool } = require('../db');
// GET  REACTION METADATA FOR A POST
const getPostReactionMetadata = async (postId, userId) => {
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
        console.error(`Error fetching reaction metadata for post ${postId}:`, err.message);
        return { counts: { like_count: 0, dislike_count: 0 }, userReaction: null };
    }
};

// GET BATCH REACTION COUNTS FOR MULTIPLE POSTS
const getBatchReactionCounts = async (postIds) => {
    if (!postIds || postIds.length === 0) return {};

    const countsResult = await pool.query(`
        SELECT 
            post_id,
            COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) AS like_count,
            COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) AS dislike_count
        FROM reactions
        WHERE post_id = ANY($1::int[]) AND comment_id IS NULL
        GROUP BY post_id
    `, [postIds]);

    const countsMap = {};
    countsResult.rows.forEach(row => {
        countsMap[row.post_id] = {
            like_count: parseInt(row.like_count) || 0,
            dislike_count: parseInt(row.dislike_count) || 0
        };
    });

    return countsMap;
};
// GET BATCH USER REACTIONS FOR MULTIPLE POSTS
const getBatchUserReactions = async (userId, postIds) => {
    if (!userId || !postIds || postIds.length === 0) return {};

    const userReactionsResult = await pool.query(`
        SELECT post_id, reaction_type
        FROM reactions
        WHERE user_id = $1 AND post_id = ANY($2::int[]) AND comment_id IS NULL
    `, [userId, postIds]);

    const userReactionsMap = {};
    userReactionsResult.rows.forEach(row => {
        userReactionsMap[row.post_id] = row.reaction_type;
    });

    return userReactionsMap;
};

// GET BATCH CATEGORIES FOR MULTIPLE POSTS
const getBatchCategories = async (postIds) => {
    if (!postIds || postIds.length === 0) return new Map();

    const categoriesResult = await pool.query(`
        SELECT pc.post_id, c.category_id, c.category_name
        FROM post_categories pc
        JOIN categories c ON pc.category_id = c.category_id
        WHERE pc.post_id = ANY($1::int[])
        ORDER BY pc.post_id, c.category_name
    `, [postIds]);

    const categoriesMap = new Map();
    categoriesResult.rows.forEach(row => {
        if (!categoriesMap.has(row.post_id)) {
            categoriesMap.set(row.post_id, []);
        }
        categoriesMap.get(row.post_id).push({
            category_id: row.category_id,
            category_name: row.category_name
        });
    });

    return categoriesMap;
};

// ENRICH POSTS WITH METADATA
const enrichPostsWithMetadata = async (posts, userId) => {
    if (!posts || posts.length === 0) return [];

    const postIds = posts.map(p => p.post_id);

    const [countsMap, userReactionsMap, categoriesMap] = await Promise.all([
        getBatchReactionCounts(postIds),
        getBatchUserReactions(userId, postIds),
        getBatchCategories(postIds)
    ]);

    return posts.map(record => ({
        post_id: record.post_id,
        author_name: record.author_name || record.display_name,
        author_avatar_url: record.author_avatar_url || null,
        content_text: record.content_text,
        categories: categoriesMap.get(record.post_id) || [],
        created_at: record.created_at,
        expires_at: record.expires_at,
        media_url: record.media_url,
        pinned: record.pinned || false,
        reaction_counts: countsMap[record.post_id] || { like_count: 0, dislike_count: 0 },
        user_reaction_type: userReactionsMap[record.post_id] || null,
    }));
};

// FORMAT POST
const formatPost = (post, reactionCounts, userReactionType) => {
    if (!post) return null;

    return {
        post_id: post.post_id,
        content_text: post.content_text,
        media_url: post.media_url,
        author_id: post.author_id,
        author_name: post.author_name || post.display_name,
        author_avatar_url: post.author_avatar_url || null,
        created_at: post.created_at,
        categories: post.categories || [],
        expires_at: post.expires_at,
        pinned: post.pinned || false,
        reaction_counts: reactionCounts,
        user_reaction_type: userReactionType,
    };
};

module.exports = {
    getPostReactionMetadata,
    getBatchReactionCounts,
    getBatchUserReactions,
    getBatchCategories,
    enrichPostsWithMetadata,
    formatPost,
};
