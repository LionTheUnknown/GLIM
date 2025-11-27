const { pool } = require('../db');

// GET ALL CATEGORIES
exports.getAllCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT category_id, category_name, description
            FROM categories
            ORDER BY category_name ASC
        `);

        const formattedCategories = result.rows.map(record => ({
            category_id: record.category_id,
            category_name: record.category_name,
            description: record.description,
        }));
        
        res.status(200).json(formattedCategories);
        
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).json({ error: 'Failed to retrieve categories', details: err.message });
    }
};

// GET CATEGORY BY ID
exports.getCategoryById = async (req, res) => {
    const categoryId = req.params.categoryId; 

    try {
        const result = await pool.query(`
            SELECT category_id, category_name, description
            FROM categories
            WHERE category_id = $1
        `, [categoryId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        const record = result.rows[0];

        const formattedCategory = {
            category_id: record.category_id,
            category_name: record.category_name,
            description: record.description,
        };
        
        res.status(200).json(formattedCategory);
        
    } catch (err) {
        console.error('Error fetching single category:', err.message);
        res.status(500).json({ error: 'Failed to retrieve category.', details: err.message });
    }
};

// CREATE CATEGORY
exports.createCategory = async (req, res) => {
    const { category_name, description } = req.body;
    
    if (!category_name || category_name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required.' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO categories (category_name, description)
            VALUES ($1, $2)
            RETURNING category_id, category_name, description, created_at
        `, [category_name.trim(), description || null]);

        const newCategory = result.rows[0];
        res.status(201).json({
            message: 'Category created successfully.',
            category: newCategory
        });

    } catch (err) {
        console.error('Error creating category:', err.message);
        
        // Handle unique constraint violation
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Category with this name already exists.' });
        }
        
        res.status(500).json({ error: 'Failed to create category.', details: err.message });
    }
};

// UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    const { category_name, description } = req.body;
    
    if (!category_name || category_name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name cannot be empty.' });
    }

    try {
        const result = await pool.query(`
            UPDATE categories 
            SET 
                category_name = $1,
                description = $2
            WHERE category_id = $3
        `, [category_name.trim(), description || null, categoryId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        res.status(200).json({ message: 'Category updated successfully.' });

    } catch (err) {
        console.error('Error updating category:', err.message);
        
        // Handle unique constraint violation
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Category with this name already exists.' });
        }
        
        res.status(500).json({ error: 'Failed to update category.', details: err.message });
    }
};

// DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        // PostgreSQL handles the cascade/set null automatically based on schema
        // Our schema has ON DELETE SET NULL for posts.category_id
        const result = await pool.query(`
            DELETE FROM categories 
            WHERE category_id = $1
        `, [categoryId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        res.status(200).json({ 
            message: 'Category deleted successfully, and associated posts were unassigned.' 
        });

    } catch (err) {
        console.error('Error deleting category:', err.message);
        res.status(500).json({ error: 'Failed to delete category.', details: err.message });
    }
};

