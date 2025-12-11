-- ============================================
-- Complete Database Schema for PostgreSQL
-- Compatible with Supabase, Neon, Railway
-- ============================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'user'
);

-- Index for faster lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. POSTS TABLE
-- ============================================
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    content_text TEXT NOT NULL,
    media_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- ============================================
-- 3.5. POST_CATEGORIES JUNCTION TABLE
-- ============================================
-- Junction table for many-to-many relationship between posts and categories
CREATE TABLE post_categories (
    post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, category_id)
);

-- Indexes for performance
CREATE INDEX idx_post_categories_post_id ON post_categories(post_id);
CREATE INDEX idx_post_categories_category_id ON post_categories(category_id);

-- ============================================
-- 4. COMMENTS TABLE
-- ============================================
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(comment_id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

-- ============================================
-- 5. REACTIONS TABLE
-- ============================================
CREATE TABLE reactions (
    reaction_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(comment_id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure user can only react once per post OR once per comment
    CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id, comment_id),
    -- Ensure reaction is either for post OR comment, not both
    CONSTRAINT check_post_or_comment CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_comment_id ON reactions(comment_id);

-- ============================================
-- 6. SEED DATA - Sample Users
-- ============================================
INSERT INTO users (username, email, password_hash, display_name, bio) VALUES
('Alice', 'alice@example.com', '$2b$12$example_hash_1', 'Alice Wonderland', 'Tech enthusiast and blogger'),
('Bob', 'bob@example.com', '$2b$12$example_hash_2', 'Bob Builder', 'Cloud computing specialist'),
('Charlie', 'charlie@example.com', '$2b$12$example_hash_3', 'Charlie Chaplin', 'Database administrator');

-- ============================================
-- 7. SEED DATA - Categories
-- ============================================
INSERT INTO categories (category_name, description) VALUES
('General', 'General discussions and topics'),
('Questions', 'Ask questions and get answers'),
('News', 'Latest news and updates'),
('Entertainment', 'Movies, music, games, and fun'),
('Lifestyle', 'Health, food, travel, and daily life');

-- ============================================
-- 8. SEED DATA - Sample Posts
-- ============================================
INSERT INTO posts (author_id, category_id, content_text, created_at) VALUES
(1, 1, 'Welcome to GLIM! Lets start some great discussions.', CURRENT_TIMESTAMP),
(2, 2, 'How do you stay motivated on difficult days?', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(3, 3, 'Interesting news article I read today - what are your thoughts?', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(1, 4, 'Whats the best movie youve watched recently?', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(2, 5, 'Sharing my favorite recipe for homemade bread!', CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- ============================================
-- 9. SEED DATA - Sample Comments
-- ============================================
INSERT INTO comments (post_id, author_id, content_text, created_at) VALUES
(1, 2, 'Puikus straipsnis! Labai informatyvu.', CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
(1, 3, 'Gera pradžia. Laukiu tęsinio!', CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
(2, 1, 'Privertė susimąstyti apie cloud migration.', CURRENT_TIMESTAMP + INTERVAL '15 minutes'),
(2, 3, 'Ar galėtumėte parekomenduoti konkretų cloud providerį?', CURRENT_TIMESTAMP + INTERVAL '20 minutes'),
(3, 1, 'Puiki SQL apžvalga! Ar bus daugiau pavyzdžių?', CURRENT_TIMESTAMP + INTERVAL '25 minutes');

-- ============================================
-- 10. SEED DATA - Sample Reactions
-- ============================================
-- Post reactions
INSERT INTO reactions (user_id, post_id, comment_id, reaction_type, created_at) VALUES
(2, 1, NULL, 'like', CURRENT_TIMESTAMP + INTERVAL '2 minutes'),
(3, 1, NULL, 'like', CURRENT_TIMESTAMP + INTERVAL '3 minutes'),
(1, 2, NULL, 'like', CURRENT_TIMESTAMP + INTERVAL '4 minutes'),
(3, 2, NULL, 'like', CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
(2, 3, NULL, 'dislike', CURRENT_TIMESTAMP + INTERVAL '6 minutes');

-- Comment reactions (based on your original script)
INSERT INTO reactions (user_id, post_id, comment_id, reaction_type, created_at) VALUES
(2, NULL, 2, 'like', CURRENT_TIMESTAMP + INTERVAL '16 minutes'),  -- Bob likes Charlie's comment (comment_id=2) on Post 1
(3, NULL, 1, 'like', CURRENT_TIMESTAMP + INTERVAL '17 minutes'),  -- Charlie likes Bob's comment (comment_id=1) on Post 1
(1, NULL, 3, 'like', CURRENT_TIMESTAMP + INTERVAL '18 minutes');  -- Alice likes her own comment (comment_id=3)

-- ============================================
-- 11. VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify data after running

-- SELECT 'Users' AS Entity, COUNT(*) AS Count FROM users;
-- SELECT 'Categories' AS Entity, COUNT(*) AS Count FROM categories;
-- SELECT 'Posts' AS Entity, COUNT(*) AS Count FROM posts;
-- SELECT 'Comments' AS Entity, COUNT(*) AS Count FROM comments;
-- SELECT 'Reactions' AS Entity, COUNT(*) AS Count FROM reactions;

-- View all posts with authors
-- SELECT p.post_id, u.username, p.content_text, p.created_at 
-- FROM posts p 
-- JOIN users u ON p.author_id = u.user_id 
-- ORDER BY p.created_at DESC;

-- View all comments with authors
-- SELECT c.comment_id, p.post_id, u.username, c.content_text, c.created_at
-- FROM comments c
-- JOIN posts p ON c.post_id = p.post_id
-- JOIN users u ON c.author_id = u.user_id
-- ORDER BY c.created_at DESC;

-- View reaction counts per post
-- SELECT p.post_id, p.content_text,
--        COUNT(CASE WHEN r.reaction_type = 'like' THEN 1 END) as likes,
--        COUNT(CASE WHEN r.reaction_type = 'dislike' THEN 1 END) as dislikes
-- FROM posts p
-- LEFT JOIN reactions r ON p.post_id = r.post_id AND r.comment_id IS NULL
-- GROUP BY p.post_id, p.content_text
-- ORDER BY p.post_id;
