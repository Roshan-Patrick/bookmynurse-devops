const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Handle both req.header() and req.headers formats
    const authHeader = (req.header && req.header('Authorization')) || req.headers['authorization'];
    const token = authHeader && authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
};

module.exports = auth;
