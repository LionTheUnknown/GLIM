const { Pool } = require('pg');

// PostgreSQL connection configuration
// Using connection string (DATABASE_URL)
const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(config);

// Test connection
pool.on('connect', () => {
    console.log('✓ PostgreSQL database connected');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        if (process.env.NODE_ENV === 'development') {
            const duration = Date.now() - start;
            console.log('Query executed:', { duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Helper to get a client from the pool
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;
    
    // Set a timeout for this client
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);
    
    // Monkey patch the query method to keep track of the last query
    client.query = (...args) => {
        client.lastQuery = args;
        return query.apply(client, args);
    };
    
    client.release = () => {
        clearTimeout(timeout);
        client.query = query;
        client.release = release;
        return release.apply(client);
    };
    
    return client;
};

module.exports = {
    pool,
    query,
    getClient,
};

