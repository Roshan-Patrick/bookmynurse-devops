const User = require('../models/clientauth.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findByEmail(email);
            
            if (!user) {
                return res.status(200).json({ message: 'Invalid email' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(200).json({ message: 'Invalid password' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email }, 
                process.env.JWT_SECRET || 'your_jwt_secret', 
                { expiresIn: "1h" }
            );

            res.json({ 
                token: token, 
                message: "Login successful" 
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    register: async (req, res) => {
        try {
            const { email, phone_number, password } = req.body;
            
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(200).json({ message: "Email already exists" });
            }

            await User.create(email, phone_number, password);
            res.status(200).json({ message: 'User registered successfully' });
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ message: 'Error creating user' });
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await User.getAllUsers();
            res.json(users);
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ message: 'Error fetching users' });
        }
    }
};

module.exports = authController;
