const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool with better configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'bnmuser',
    password: process.env.DB_PASSWORD || 'bnmpassword',
    database: process.env.DB_NAME || 'bookmynurse',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000,
    idleTimeout: 300000,
    timezone: 'Z',
    charset: 'utf8mb4',
    debug: process.env.NODE_ENV === 'development'
});

// Create a promise wrapper for the pool
const promisePool = pool.promise();

// Handle pool errors with more detailed logging
pool.on('error', (err) => {
    console.error('Database pool error:', {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        timestamp: new Date().toISOString()
    });

    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed. Attempting to reconnect...');
        // Attempt to reconnect
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Reconnection failed:', err);
                return;
            }
            console.log('Successfully reconnected to database.');
            connection.release();
        });
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections. Current pool status:', {
            totalConnections: pool.totalConnections,
            idleConnections: pool.idleConnections,
            waitingRequests: pool.waitingRequests
        });
    } else if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused. Check if database is running.');
    } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.error('Fatal error occurred. Attempting to reconnect...');
    }
});

// Add periodic connection check using promise pool
setInterval(async () => {
    try {
        const connection = await promisePool.getConnection();
        await connection.ping();
        connection.release();
        console.log('Database connection is alive');
    } catch (err) {
        console.error('Periodic connection check failed:', err);
    }
}, 300000);

// Test the connection using promise pool
(async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('Successfully connected to database.');
        connection.release();
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
})();

// Export the promise pool and a simplified query function
module.exports = {
    pool: promisePool, // Export the promise pool as the main pool
    query: async (sql, values) => {
        try {
            const [results] = await promisePool.query(sql, values);
            return results;
        } catch (err) {
            console.error('Query error:', err);
            throw err;
        }
    }
};
