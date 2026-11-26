const {Department} = require("../model");

const createDepartment = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Department name is required' });
        }
        const department = await Department.create({ name });
        res.status(201).json({ message: 'Department created successfully', department });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.findAll();
        res.status(200).json({ departments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createDepartment,
    getAllDepartments
};