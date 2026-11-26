const {Category} = require('../model');

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const category = await Category.create({ name });
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).json({ categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createCategory,
    getAllCategories
};