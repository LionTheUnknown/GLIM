require('dotenv').config(); 
const express = require('express');
const app = express();
const port = process.env.PORT;

const userRoutes = require('./routes/user_routes');
const postRoutes = require('./routes/post_routes');
const commentRoutes = require('./routes/comment_routes');
const categoriesRoutes = require('./routes/category_routes');
const { poolPromise } = require('./db');

const cors = require('cors'); 

const corsOptions = {
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions)); 

app.use(express.json());

app.use('/api/users', userRoutes);

app.use('/api/posts', postRoutes);

app.use('/api/categories', categoriesRoutes);

poolPromise
    .then(pool => {
        console.log("Database connection pool created.");
        
        app.listen(port, () => {
            console.log(`Running on: http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('FATAL ERROR: Database connection failed:', err.message);
        process.exit(1); 
    });