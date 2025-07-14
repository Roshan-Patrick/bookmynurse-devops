const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const authController = {
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            console.log('Login attempt for username:', username);
            
            // Test database connection
            const [testResult] = await db.query('SELECT 1 as test');
            console.log('Database connection test result:', testResult);
            
            const user = await User.findByUsername(username);
            console.log('User found:', user ? 'Yes' : 'No');
            
            if (!user) {
                console.log('No user found with username:', username);
                return res.status(401).json({ msg: 'Invalid Username' });
            }

            console.log('Comparing passwords...');
            console.log('Provided password:', password);
            console.log('Stored hash:', user.password);
            
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Password match:', isMatch ? 'Yes' : 'No');
            
            if (!isMatch) {
                return res.status(401).json({ msg: 'Invalid password' });
            }

            const token = jwt.sign(
                { id: user.id, role: user.role }, 
                process.env.JWT_SECRET || 'your_jwt_secret', 
                { expiresIn: "1hr" }
            );

            res.json({ 
                token: token,
                msg: "Authorized"
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ msg: 'Internal server error' });
        }
    },

    register: async (req, res) => {
        try {
            const { username, password, role } = req.body;
            await User.create(username, password, role);
            res.status(201).json({ msg: 'User registered successfully' });
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ msg: 'Error creating user' });
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await User.getAllUsers();
            res.json(users);
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ msg: 'Error fetching users' });
        }
    }
};

module.exports = authController;
