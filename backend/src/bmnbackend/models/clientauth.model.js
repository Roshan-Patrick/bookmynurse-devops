const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
    create: async (email, phone_number, password) => {
        try {
            const hash = await bcrypt.hash(password, 10);
            const result = await db.query(
                'INSERT INTO clientusers (email, phone_number, password) VALUES (?, ?, ?)',
                [email, phone_number, hash]
            );
            return result;
        } catch (err) {
            console.error('Error creating client user:', err);
            throw err;
        }
    },

    findByEmail: async (email) => {
        try {
            console.log('Executing findByEmail query for:', email);
            const results = await db.query('SELECT * FROM clientusers WHERE email = ?', [email]);
            console.log('Query results:', JSON.stringify(results, null, 2));
            
            if (!Array.isArray(results) || results.length === 0) {
                console.log('No results found for email:', email);
                return null;
            }
            
            const user = results[0];
            console.log('User found:', user.email);
            return user;
        } catch (err) {
            console.error('Error finding client user by email:', err);
            throw err;
        }
    },

    getAllUsers: async () => {
        try {
            const results = await db.query('SELECT id, email, phone_number FROM clientusers');
            // console.log('Raw query results:', JSON.stringify(results, null, 2));
            
            // If results is a single object, wrap it in an array
            if (!Array.isArray(results)) {
                console.log('Converting single result to array');
                return [results];
            }
            
            return results;
        } catch (err) {
            console.error('Error getting all client users:', err);
            throw err;
        }
    }
};

module.exports = User;
