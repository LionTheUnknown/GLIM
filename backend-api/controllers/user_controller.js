const { pool } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { uploadAvatarBuffer, deleteAvatar, extractKeyFromUrl } = require('../utils/storage');

const saltRounds = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_JWT_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT user_id, username, display_name, created_at, avatar_url
            FROM users 
            ORDER BY created_at DESC
        `);

        res.status(200).json(result.rows);

    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
    }
};

// REGISTER USER
exports.registerUser = async (req, res) => {
    const { username, email, password, display_name = '', bio = '' } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const finalDisplayName = display_name.trim() || username;

        await pool.query(`
            INSERT INTO users (username, email, password_hash, display_name, bio)
            VALUES ($1, $2, $3, $4, $5)
        `, [username, email, hashedPassword, finalDisplayName, bio]);

        res.status(201).json({ message: 'User registered.' });
        
    } catch (err) {
        console.error('Registration failed:', err.message);
        
        if (err.code === '23505') {
            if (err.constraint?.includes('username')) {
                return res.status(400).json({ error: 'Username already exists.' });
            }
            if (err.constraint?.includes('email')) {
                return res.status(400).json({ error: 'Email already exists.' });
            }
        }
        
        res.status(500).json({ error: 'Registration failed.' });
    }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Identifier (email or username) and password are required.' });
    }

    try {
        const result = await pool.query(`
            SELECT user_id, username, password_hash, role, avatar_url
            FROM users 
            WHERE email = $1 OR username = $1
        `, [identifier]);

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const role = user.role || 'user';
        const userCreds = { user_id: user.user_id, username: user.username, role: role };

        const accessToken = jwt.sign(
            userCreds,
            JWT_SECRET, 
            { expiresIn: '10min' }
        );

        const refreshToken = jwt.sign(
            userCreds,
            REFRESH_JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful.',
            token: accessToken,
            refresh_token: refreshToken,
            user_id: user.user_id,
            username: user.username,
            role: role,
            avatar_url: user.avatar_url || null
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server failed to process login.' });
    }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(`
            SELECT user_id, username, display_name, bio, avatar_url
            FROM users 
            WHERE user_id = $1
        `, [userId]);

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('Error fetching current user:', err.message);
        res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
};

// UPDATE CURRENT USER PROFILE
exports.updateCurrentUser = async (req, res) => {
    const userId = req.user.user_id;
    const { display_name, bio } = req.body;

    try {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (display_name !== undefined) {
            updates.push(`display_name = $${paramCount}`);
            values.push(display_name.trim() || null);
            paramCount++;
        }

        if (bio !== undefined) {
            updates.push(`bio = $${paramCount}`);
            values.push(bio.trim() || null);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(userId);

        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramCount}`,
            values
        );

        const result = await pool.query(
            `SELECT user_id, username, display_name, bio, avatar_url FROM users WHERE user_id = $1`,
            [userId]
        );

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
};

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function getExtension(mime) {
    if (mime === 'image/png') return 'png';
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
    if (mime === 'image/webp') return 'webp';
    return '';
}

exports.uploadAvatar = async (req, res) => {
    const userId = req.user.user_id;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Unsupported file type.' });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return res.status(400).json({ error: 'File too large. Max 5MB.' });
    }

    try {
        const ext = getExtension(file.mimetype);
        const { publicUrl } = await uploadAvatarBuffer(file.buffer, userId, file.mimetype, ext);

        await pool.query(
            `UPDATE users SET avatar_url = $1 WHERE user_id = $2`,
            [publicUrl, userId]
        );

        const result = await pool.query(
            `SELECT user_id, username, display_name, bio, avatar_url FROM users WHERE user_id = $1`,
            [userId]
        );

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Avatar upload failed:', err.message);
        res.status(500).json({ error: 'Failed to upload avatar.' });
    }
};

exports.deleteAvatar = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const current = await pool.query(
            `SELECT avatar_url FROM users WHERE user_id = $1`,
            [userId]
        );
        const currentUrl = current.rows[0]?.avatar_url || null;
        const key = extractKeyFromUrl(currentUrl);

        await pool.query(
            `UPDATE users SET avatar_url = NULL WHERE user_id = $1`,
            [userId]
        );

        if (key) {
            try {
                await deleteAvatar(key);
            } catch (err) {
                console.warn('Failed to delete avatar object:', err.message);
            }
        }

        res.status(200).json({ message: 'Avatar removed.' });
    } catch (err) {
        console.error('Avatar delete failed:', err.message);
        res.status(500).json({ error: 'Failed to delete avatar.' });
    }
};

// GET CURRENT USER'S POSTS
exports.getMyPosts = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(`
            SELECT posts.post_id, posts.content_text,
                users.display_name AS author_name, users.avatar_url AS author_avatar_url,
                posts.created_at, posts.expires_at, posts.media_url, posts.pinned
            FROM posts
            JOIN users ON posts.author_id = users.user_id 
            WHERE posts.author_id = $1
            ORDER BY posts.created_at DESC
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(200).json([]);
        }

        const { enrichPostsWithMetadata } = require('../utils/postHelpers');
        const formattedPosts = await enrichPostsWithMetadata(result.rows, userId);
        res.status(200).json(formattedPosts);
        
    } catch (err) {
        console.error('Error fetching user posts:', err.message);
        res.status(500).json({ error: 'Failed to retrieve posts', details: err.message });
    }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
        const decoded = jwt.verify(refresh_token, REFRESH_JWT_SECRET);

        const newAccessToken = jwt.sign(
            {
                user_id: decoded.user_id,
                username: decoded.username,
                role: decoded.role || 'user'
            },
            JWT_SECRET,
            { expiresIn: '10min' }
        );

        res.status(200).json({
            message: 'Token refreshed successfully.',
            token: newAccessToken
        });
    } catch (err) {
        console.error('Refresh token error:', err.message);
        return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
};

