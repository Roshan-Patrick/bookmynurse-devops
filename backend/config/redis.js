const Redis = require('ioredis');
require('dotenv').config();

/**
 * Redis Configuration
 * Provides Redis connection configuration for different environments
 */

const getRedisConfig = () => {
    const config = {
        // Connection settings
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        
        // Connection options
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        
        // Timeouts
        connectTimeout: 10000,
        commandTimeout: 5000,
        
        // Connection pool
        family: 4, // IPv4
        keepAlive: 30000,
        
        // Error handling
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        
        // Logging
        showFriendlyErrorStack: process.env.NODE_ENV === 'development'
    };

    // Add authentication if password is provided
    if (config.password) {
        config.password = config.password;
    }

    return config;
};

/**
 * Create Redis connection with proper error handling
 */
const createRedisConnection = () => {
    const config = getRedisConfig();
    const redis = new Redis(config);

    // Connection event handlers
    redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
    });

    redis.on('ready', () => {
        console.log('✅ Redis ready for operations');
    });

    redis.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
    });

    redis.on('close', () => {
        console.log('🔒 Redis connection closed');
    });

    redis.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
    });

    // Test connection
    redis.ping().then(() => {
        console.log('✅ Redis ping successful');
    }).catch((err) => {
        console.error('❌ Redis ping failed:', err.message);
    });

    return redis;
};

/**
 * Health check function for Redis
 */
const checkRedisHealth = async (redis) => {
    try {
        const result = await redis.ping();
        return result === 'PONG';
    } catch (error) {
        console.error('Redis health check failed:', error.message);
        return false;
    }
};

/**
 * Graceful shutdown for Redis
 */
const closeRedisConnection = async (redis) => {
    try {
        await redis.quit();
        console.log('✅ Redis connection closed gracefully');
    } catch (error) {
        console.error('❌ Error closing Redis connection:', error.message);
    }
};

module.exports = {
    getRedisConfig,
    createRedisConnection,
    checkRedisHealth,
    closeRedisConnection
};
