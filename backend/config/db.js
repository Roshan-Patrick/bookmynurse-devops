const mysql = require('mysql2');
require('dotenv').config();

// Singleton pattern - only one pool instance
let pool = null;

/**
 * Factory function to create database connection pool
 * Uses lazy initialization - only creates when first needed
 */
const createPool = () => {
    if (pool) {
        return pool; // Return existing pool
    }

    const poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'bnmuser',
        password: process.env.DB_PASSWORD || 'bnmpassword',
        database: process.env.DB_NAME || 'bookmynurse',
        waitForConnections: true,
        connectionLimit: process.env.NODE_ENV === 'test' ? 5 : 20, // Smaller limit for tests
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: process.env.NODE_ENV === 'test' ? 1000 : 10000, // Faster timeout for tests
        idleTimeout: 300000,
        timezone: 'Z',
        charset: 'utf8mb4',
        debug: process.env.NODE_ENV === 'development'
    };

    pool = mysql.createPool(poolConfig);

    // Enhanced error handling
    pool.on('error', (err) => {
        console.error('Database pool error:', {
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage,
            timestamp: new Date().toISOString()
        });
    });

    pool.on('connection', (connection) => {
        console.log(`Database connection established as id ${connection.threadId}`);
    });

    pool.on('acquire', (connection) => {
        console.log(`Connection ${connection.threadId} acquired`);
    });

    pool.on('release', (connection) => {
        console.log(`Connection ${connection.threadId} released`);
    });

    return pool;
};

/**
 * Get the database pool (lazy initialization)
 */
const getPool = () => {
    return createPool();
};

/**
 * Execute a database query with proper error handling
 */
const query = async (sql, values = []) => {
    try {
        const promisePool = getPool().promise();
        const [results] = await promisePool.query(sql, values);
        return results;
    } catch (err) {
        console.error('Database query error:', {
            sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
            values: values,
            error: err.message,
            timestamp: new Date().toISOString()
        });
        throw err;
    }
};

/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        const result = await query('SELECT 1 as test');
        console.log('✅ Database connection test successful');
        return result;
    } catch (err) {
        console.error('❌ Database connection test failed:', err.message);
        throw err;
    }
};

/**
 * Close the database pool gracefully
 */
const closePool = async () => {
    if (pool) {
        try {
            await pool.end();
            pool = null;
            console.log('🔒 Database pool closed gracefully');
        } catch (err) {
            console.error('Error closing database pool:', err.message);
            throw err;
        }
    }
};

/**
 * Get pool statistics for monitoring
 */
const getPoolStats = () => {
    if (!pool) {
        return { status: 'not_initialized' };
    }
    
    return {
        status: 'connected',
        totalConnections: pool._allConnections.length,
        freeConnections: pool._freeConnections.length,
        acquiringConnections: pool._acquiringConnections.length,
        connectionLimit: pool.config.connectionLimit
    };
};

// Only run connection test in non-test environments
if (process.env.NODE_ENV !== 'test') {
    // Test connection on startup
    testConnection().catch(err => {
        console.error('Failed to establish database connection:', err.message);
    });

    // Health check every 5 minutes
    setInterval(async () => {
        try {
            await testConnection();
        } catch (err) {
            console.error('Database health check failed:', err.message);
        }
    }, 300000); // 5 minutes
}

module.exports = {
    // Core functions
    query,
    getPool,
    createPool, // Expose factory for testing
    
    // Utility functions
    testConnection,
    closePool,
    getPoolStats,
    
    // Legacy compatibility - CRITICAL for production!
    pool: () => getPool(), // Function that returns pool for backward compatibility
    originalPool: getPool() // Direct access to pool for existing code
};