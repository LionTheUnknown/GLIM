-- Migration: Add support for multiple categories per post
-- This creates a junction table for many-to-many relationship between posts and categories

-- Create post_categories junction table
CREATE TABLE IF NOT EXISTS post_categories (
    post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, category_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_categories_post_id ON post_categories(post_id);
CREATE INDEX IF NOT EXISTS idx_post_categories_category_id ON post_categories(category_id);

-- Migrate existing data: copy category_id from posts to post_categories
INSERT INTO post_categories (post_id, category_id)
SELECT post_id, category_id
FROM posts
WHERE category_id IS NOT NULL
ON CONFLICT (post_id, category_id) DO NOTHING;

-- Note: We keep category_id in posts table for backward compatibility
-- but new posts should use post_categories junction table

