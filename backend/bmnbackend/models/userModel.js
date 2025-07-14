const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
    create: async (username, password, role) => {
        try {
            const hash = await bcrypt.hash(password, 10);
            
            if (role) {
                const result = await db.query(
                    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                    [username, hash, role]
                );
                return result;
            } else {
                // Don't send role – let MySQL use default 'user'
                const result = await db.query(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, hash]
                );
                return result;
            }
        } catch (err) {
            console.error('Error creating user:', err);
            throw err;
        }
    },
    
    findByUsername: async (username) => {
        try {
            console.log('Executing findByUsername query for:', username);
            const query = 'SELECT * FROM users WHERE username = ?';
            console.log('Query:', query);
            
            const results = await db.query(query, [username]);
            console.log('Query results:', JSON.stringify(results, null, 2));
            
            // Check if results is an array and has elements
            if (!Array.isArray(results) || results.length === 0) {
                console.log('No results found for username:', username);
                return null;
            }
            
            const user = results[0];
            console.log('User found:', user.username);
            return user;
        } catch (err) {
            console.error('Error finding user by username:', err);
            throw err;
        }
    },

    getAllUsers: async () => {
        try {
            const results = await db.query('SELECT * FROM users');
            // console.log('Raw query results:', JSON.stringify(results, null, 2));
            
            // If results is a single object, wrap it in an array
            if (!Array.isArray(results)) {
                console.log('Converting single result to array');
                return [results];
            }
            
            return results;
        } catch (err) {
            console.error('Error getting all users:', err);
            throw err;
        }
    }
};

module.exports = User;
