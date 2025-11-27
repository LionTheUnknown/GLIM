require('dotenv').config(); 
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const userRoutes = require('./routes/user_routes');
const postRoutes = require('./routes/post_routes');
const commentRoutes = require('./routes/comment_routes');
const categoriesRoutes = require('./routes/category_routes');
const { pool } = require('./db');

const cors = require('cors'); 

// Parse CORS_ORIGIN environment variable (supports multiple origins)
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3001'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions)); 
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        res.status(200).json({ 
            status: 'healthy', 
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            error: err.message 
        });
    }
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoriesRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Test database connection before starting server
pool.query('SELECT NOW()')
    .then(() => {
        console.log('✓ Database connection successful');
        
        app.listen(port, () => {
            console.log(`✓ Server running on: http://localhost:${port}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ CORS enabled for: ${allowedOrigins.join(', ')}`);
        });
    })
    .catch(err => {
        console.error('✗ FATAL ERROR: Database connection failed');
        console.error('✗ Error details:', err.message);
        console.error('\nPlease check:');
        console.error('  1. Database credentials in .env file');
        console.error('  2. Database server is running');
        console.error('  3. Network connectivity');
        console.error('  4. Firewall settings');
        process.exit(1); 
    });

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, closing server gracefully...');
    await pool.end();
    process.exit(0);
});

