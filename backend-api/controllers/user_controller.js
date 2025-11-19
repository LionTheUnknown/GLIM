const { poolPromise, sql } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// normally 10 but using 12 for modern recommendations
const saltRounds = 12;

const JWT_SECRET = process.env.JWT_SECRET;

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultSet = await pool.request().query(`
            SELECT user_id, username, display_name, created_at 
            FROM users 
            ORDER BY created_at DESC;
        `);

        res.status(200).json(resultSet.recordset);

    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
    }
};

// REGISTER USER
exports.registerUser = async (req, res) => {
    const { username, email, password, display_name = '', bio = '' } = req.body;
    let hashedPassword;

    try {
        const pool = await poolPromise;

        hashedPassword = await bcrypt.hash(password, saltRounds);

        const finalDisplayName = display_name.trim() || username;

        await pool.request()
            .input('Username', sql.VarChar(50), username)
            .input('Email', sql.VarChar(100), email)
            .input('PasswordHash', sql.VarChar(255), hashedPassword)
            .input('DisplayName', sql.NVarChar(100), finalDisplayName)
            .input('Bio', sql.NVarChar(255), bio)
            .query(`
                INSERT INTO users (username, email, password_hash, display_name, bio)
                VALUES (@Username, @Email, @PasswordHash, @DisplayName, @Bio)
            `);

        res.status(201).json({ message: 'User registered.' });
    } catch (err) {
        console.error('Registration failed:', err.message);
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
        const pool = await poolPromise;

        const result = await pool.request()
            .input('Identifier', sql.VarChar(100), identifier)
            .query(`
                SELECT user_id, username, password_hash 
                FROM users 
                WHERE email = @Identifier OR username = @Identifier
            `);

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) return res.status(401).json({ message: 'Invalid credentials.' });

        const role = user.role || 'user';
        const token = jwt.sign({ user_id: user.user_id, username: user.username, role: role }, JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            message: 'Login successful.',
            token,
            user_id: user.user_id,
            username: user.username,
            role: role
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server failed to process login.' });
    }
};

// dunno if it works havent tested
exports.getCurrentUser = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .query(`SELECT user_id, username, display_name, bio FROM users WHERE user_id = @UserId`);

        if (!result.recordset[0]) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json(result.recordset[0]);

    } catch (err) {
        console.error('Error fetching current user:', err.message);
        res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
};