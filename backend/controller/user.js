const bcrypt = require('bcrypt');
const { User, Department } = require('../model');

const editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, id_departmans, position } = req.body;
        if (
            typeof username !== "string" || !username.trim()
            || !id_departmans
            || typeof position !== "string" || !position.trim()
        ) {
            return res.status(400).json({ message: "Username, department, and position are required." });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const updates = {
            username: username.trim(),
            id_departmans,
            position: position.trim()
        };
        if (password !== undefined && password !== "") {
            if (typeof password !== "string") {
                return res.status(400).json({ message: "Password must be a string." });
            }
            updates.password = await bcrypt.hash(password, 10);
        }

        await user.update(updates);
        res.json({
            message: "User updated successfully.",
            user: {
                id_user: user.id_user,
                username: user.username,
                id_departmans: user.id_departmans,
                position: user.position
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        await user.destroy();
        res.json({ message: "User deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id_user", "username", "id_departmans", "position"],
            include: [{
                model: Department,
                as: "department",
                attributes: ["id_departmans", "name"]
            }],
            order: [["username", "ASC"]]
        });
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
    editUser,
    deleteUser,
    getAllUsers
};