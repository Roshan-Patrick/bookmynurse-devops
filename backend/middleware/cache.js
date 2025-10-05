/**
 * Redis Caching Middleware
 * Provides caching functionality for API responses
 */

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {string} keyPrefix - Prefix for cache keys
 */
const cache = (ttl = 300, keyPrefix = 'api') => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip caching if Redis is not available
        if (!req.redis || req.redis.status !== 'connected') {
            return next();
        }

        try {
            // Generate cache key
            const cacheKey = `${keyPrefix}:${req.originalUrl}:${JSON.stringify(req.query)}`;
            
            // Try to get from cache
            const cachedData = await req.redis.get(cacheKey);
            
            if (cachedData) {
                console.log(`✅ Cache HIT for key: ${cacheKey}`);
                return res.json(JSON.parse(cachedData));
            }

            console.log(`❌ Cache MISS for key: ${cacheKey}`);
            
            // Store original res.json method
            const originalJson = res.json.bind(res);
            
            // Override res.json to cache the response
            res.json = async (data) => {
                try {
                    // Cache the response
                    await req.redis.set(cacheKey, JSON.stringify(data), ttl);
                    console.log(`💾 Cached response for key: ${cacheKey} (TTL: ${ttl}s)`);
                } catch (cacheError) {
                    console.error('❌ Cache write error:', cacheError.message);
                }
                
                // Send the response
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('❌ Cache middleware error:', error.message);
            next();
        }
    };
};

/**
 * Invalidate cache for specific patterns
 * @param {string} pattern - Cache key pattern to invalidate
 */
const invalidateCache = (pattern) => {
    return async (req, res, next) => {
        try {
            if (req.redis && req.redis.status === 'connected') {
                // Get all keys matching the pattern
                const keys = await req.redis.redis.keys(pattern);
                
                if (keys.length > 0) {
                    // Delete all matching keys
                    await req.redis.redis.del(...keys);
                    console.log(`🗑️ Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
                }
            }
        } catch (error) {
            console.error('❌ Cache invalidation error:', error.message);
        }
        
        next();
    };
};

/**
 * Session cache middleware
 * Stores user sessions in Redis
 */
const sessionCache = () => {
    return async (req, res, next) => {
        // Skip if Redis is not available
        if (!req.redis || req.redis.status !== 'connected') {
            return next();
        }

        try {
            // Check for session token in headers
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const sessionKey = `session:${token}`;
                
                // Try to get session from cache
                const sessionData = await req.redis.get(sessionKey);
                
                if (sessionData) {
                    req.user = JSON.parse(sessionData);
                    console.log(`✅ Session found in cache for user: ${req.user.id}`);
                }
            }
        } catch (error) {
            console.error('❌ Session cache error:', error.message);
        }
        
        next();
    };
};

/**
 * Store session in cache
 * @param {string} token - JWT token
 * @param {object} userData - User data to store
 * @param {number} ttl - Session TTL in seconds (default: 3600 = 1 hour)
 */
const storeSession = async (redis, token, userData, ttl = 3600) => {
    try {
        if (redis && redis.status === 'connected') {
            const sessionKey = `session:${token}`;
            await redis.set(sessionKey, JSON.stringify(userData), ttl);
            console.log(`💾 Session stored for user: ${userData.id} (TTL: ${ttl}s)`);
        }
    } catch (error) {
        console.error('❌ Session storage error:', error.message);
    }
};

/**
 * Remove session from cache
 * @param {string} token - JWT token to remove
 */
const removeSession = async (redis, token) => {
    try {
        if (redis && redis.status === 'connected') {
            const sessionKey = `session:${token}`;
            await redis.redis.del(sessionKey);
            console.log(`🗑️ Session removed for token: ${token}`);
        }
    } catch (error) {
        console.error('❌ Session removal error:', error.message);
    }
};

module.exports = {
    cache,
    invalidateCache,
    sessionCache,
    storeSession,
    removeSession
};
