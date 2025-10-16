const { poolPromise, sql } = require('../db');

// GET ALL Categories
exports.getAllCategories = async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultSet = await pool.request().query(`
            SELECT categories.category_id, categories.category_name
            FROM categories
            ORDER BY categories.category_name DESC;
        `);

        const formattedCategories = resultSet.recordset.map(record => ({
            category_id: record.category_id,
            category_name: record.category_name,
        }));
        
        res.status(200).json(formattedCategories);
        
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).json({ error: 'Failed to retrieve categories', details: err.message });
    }
};

// UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    const { category_name } = req.body;
    
    if (!category_name || category_name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name cannot be empty.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CategoryId', sql.Int, categoryId)
            .input('CategoryName', sql.NVarChar(255), category_name)
            .query(`
                UPDATE categories 
                SET category_name = @CategoryName
                WHERE category_id = @CategoryId;
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        res.status(200).json({ message: 'Category updated successfully.' });

    } catch (err) {
        console.error('Error updating category:', err.message);
        res.status(500).json({ error: 'Failed to update category.', details: err.message });
    }
};

// DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        const pool = await poolPromise;
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const result = await transaction.request()
                .input('CategoryId', sql.Int, categoryId)
                .query(`
                    DELETE FROM categories 
                    WHERE category_id = @CategoryId;
                `);

            if (result.rowsAffected[0] === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Category not found.' });
            }

            await transaction.commit();
            res.status(200).json({ message: 'Category deleted successfully, and associated posts were unassigned.' });

        } catch (txnErr) {
            await transaction.rollback();
            throw txnErr;
        }

    } catch (err) {
        console.error('Error deleting category:', err.message);
        res.status(500).json({ error: 'Failed to delete category.', details: err.message });
    }
};

// CREATE POST
exports.createPost = async (req, res) => {
    const authorId = req.user.user_id;

    const { content_text, category_id, media_url} = req.body;

    if(!content_text || content_text.trim().length === 0){
        return res.status(400).json({ error: 'Something needs to be written for the post to be made' });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request()
        .input('authorId', sql.Int, authorId) 
        .input('categoryId', sql.Int, category_id ? parseInt(category_id) : null)
        .input('contentText', sql.NVarChar(4000), content_text)
        .input('mediaUrl', sql.VarChar(255), media_url || null);

        await request.query(`
            INSERT INTO posts (author_id, category_id, content_text, media_url) 
            VALUES (@authorId, @categoryId, @contentText, @mediaUrl)
        `);

        res.status(201).json({ message: 'Post created successfully.' });

        } catch (err) {
        console.error('Error creating post:', err.message);
        res.status(500).json({ error: 'Failed to create post.', details: err.message });
    }
};
// GET CATEGORY BY ID
exports.getCategoryById = async (req, res) => {
    const categoryId = req.params.categoryId; 

    try {
        const pool = await poolPromise;

        const resultSet = await pool.request()
            .input('CategoryId', sql.Int, categoryId)
            .query(`
                SELECT category_id, category_name
                FROM categories
                WHERE category_id = @CategoryId;
            `);

        if (resultSet.recordset.length === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        const record = resultSet.recordset[0];

        const formattedCategory = {
            category_id: record.category_id,
            category_name: record.category_name,
        };
        
        res.status(200).json(formattedCategory);
        
    } catch (err) {
        console.error('Error fetching single category:', err.message);
        res.status(500).json({ error: 'Failed to retrieve category.', details: err.message });
    }
};