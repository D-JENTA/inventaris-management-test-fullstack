const {User,} = require('../model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_ROUNDS = 10;
const register = async (req, res) => {
    try {
        const { username, password, id_departmans, position } = req.body;
        if (!username || !password || !id_departmans || !position) {
            return res.status(400).json({ message: 'Username, password, department, and position are required' });
        }
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({
            username,
            password: hashedPassword,
            id_departmans: id_departmans,
            position
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id_user: user.id_user,
                username: user.username,
                id_departmans: user.id_departmans,
                position: user.position
            }
        });
    }catch (error) {  
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: user.id_user, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



module.exports = {
    register,
    login,
};