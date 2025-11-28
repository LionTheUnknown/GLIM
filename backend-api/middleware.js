const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }

        req.user = { user_id: user.user_id, role: user.role };

        next();
    });
};

// Optional authentication - sets req.user if token is valid, but doesn't fail if missing
exports.optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // No token provided - continue without authentication
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Invalid token - continue without authentication
            req.user = null;
            return next();
        }

        // Valid token - set user
        req.user = { user_id: user.user_id, role: user.role };
        next();
    });
};