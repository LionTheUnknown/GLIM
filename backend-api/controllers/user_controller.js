const { pool } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_JWT_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT user_id, username, display_name, created_at 
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
            SELECT user_id, username, password_hash, role
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
            role: role
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
            SELECT user_id, username, display_name, bio 
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

