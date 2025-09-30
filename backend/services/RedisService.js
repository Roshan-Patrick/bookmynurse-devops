const Redis = require('ioredis');

class RedisService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });

        this.status = 'disconnected';
        this.totalCacheHits = 0;
        this.totalCacheMisses = 0;

        // Handle connection events
        this.redis.on('connect', () => {
            this.status = 'connected';
            console.log('✅ Redis connected successfully');
        });

        this.redis.on('error', (error) => {
            this.status = 'error';
            console.error('❌ Redis connection error:', error.message);
        });

        this.redis.on('close', () => {
            this.status = 'disconnected';
            console.log('⚠️ Redis connection closed');
        });

        this.redis.on('reconnecting', () => {
            this.status = 'reconnecting';
            console.log('🔄 Redis reconnecting...');
        });
    }

    /**
     * Generates a unique cache key based on endpoint and query parameters.
     * Uses MD5 hash for consistency and brevity.
     * @param {string} endpoint - The API endpoint.
     * @param {Object} params - Query parameters.
     * @returns {string} Hashed cache key.
     */
    generateCacheKey(endpoint, params) {
        const crypto = require('crypto');
        const paramString = JSON.stringify(params);
        const hash = crypto.createHash('md5').update(paramString).digest('hex');
        return `${endpoint}:${hash}`;
    }

    /**
     * Caches data with a Time-To-Live (TTL).
     * @param {string} key - The cache key.
     * @param {Object} data - The data to cache.
     * @param {number} ttl - TTL in seconds (default: 300s = 5 minutes).
     */
    async set(key, data, ttl = 300) {
        if (this.status !== 'connected') {
            console.warn('Redis not ready, skipping cache set', { key, service: 'bmn-backend' });
            return;
        }
        try {
            await this.redis.setex(key, ttl, JSON.stringify(data));
            console.log(`📦 Cached data: ${key} (TTL: ${ttl}s)`);
        } catch (error) {
            console.error('❌ Error setting cache:', error.message, { key, service: 'bmn-backend' });
        }
    }

    /**
     * Retrieves data from cache.
     * @param {string} key - The cache key.
     * @returns {Object|null} Cached data or null if not found/error.
     */
    async get(key) {
        if (this.status !== 'connected') {
            console.warn('Redis not ready, skipping cache get', { key, service: 'bmn-backend' });
            return null;
        }
        try {
            const data = await this.redis.get(key);
            if (data) {
                this.totalCacheHits++;
                console.log(`📦 Cache HIT: ${key}`);
                return JSON.parse(data);
            }
            this.totalCacheMisses++;
            console.log(`📦 Cache MISS: ${key}`);
            return null;
        } catch (error) {
            console.error('❌ Error getting cache:', error.message, { key, service: 'bmn-backend' });
            return null;
        }
    }

    /**
     * Clears a specific key from cache.
     * @param {string} key - The cache key to clear.
     * @returns {number} Number of keys deleted.
     */
    async clear(key) {
        if (this.status !== 'connected') {
            console.warn('Redis not ready, skipping cache clear', { key, service: 'bmn-backend' });
            return 0;
        }
        try {
            const deleted = await this.redis.del(key);
            if (deleted > 0) {
                console.log(`🗑️ Cleared cache for key: ${key}`);
            }
            return deleted;
        } catch (error) {
            console.error('❌ Error clearing cache:', error.message, { key, service: 'bmn-backend' });
            return 0;
        }
    }

    /**
     * Clears all keys matching a pattern. Use with caution in production.
     * @param {string} pattern - The pattern to match (e.g., 'bookings:*', 'nurses:*').
     * @returns {number} Number of keys deleted.
     */
    async clearByPattern(pattern) {
        if (this.status !== 'connected') {
            console.warn('Redis not ready, skipping cache clear by pattern', { pattern, service: 'bmn-backend' });
            return 0;
        }
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                const deleted = await this.redis.del(...keys);
                console.log(`🗑️ Cleared ${deleted} keys matching pattern: ${pattern}`);
                return deleted;
            }
            console.log(`No keys found matching pattern: ${pattern}`);
            return 0;
        } catch (error) {
            console.error('❌ Error clearing cache by pattern:', error.message, { pattern, service: 'bmn-backend' });
            return 0;
        }
    }

    /**
     * Clears all cache. Use with extreme caution in production.
     * @returns {string} Result of FLUSHDB.
     */
    async clearAllCache() {
        if (this.status !== 'connected') {
            console.warn('Redis not ready, skipping clear all cache', { service: 'bmn-backend' });
            return 'Redis not connected';
        }
        try {
            const result = await this.redis.flushdb();
            this.totalCacheHits = 0;
            this.totalCacheMisses = 0;
            console.log('🗑️ All Redis cache cleared!');
            return result;
        } catch (error) {
            console.error('❌ Error clearing all cache:', error.message, { service: 'bmn-backend' });
            return 'Error';
        }
    }

    /**
     * Get current cache statistics.
     * @returns {Object} Cache statistics.
     */
    getStats() {
        return {
            status: this.status,
            totalCacheHits: this.totalCacheHits,
            totalCacheMisses: this.totalCacheMisses,
            hitRatio: this.totalCacheHits + this.totalCacheMisses > 0
                ? (this.totalCacheHits / (this.totalCacheHits + this.totalCacheMisses)).toFixed(2)
                : 'N/A'
        };
    }

    /**
     * Disconnects from Redis.
     */
    async disconnect() {
        if (this.status === 'connected' || this.status === 'reconnecting') {
            await this.redis.quit();
            console.log('👋 Disconnected from Redis');
        }
    }
}

module.exports = RedisService;
