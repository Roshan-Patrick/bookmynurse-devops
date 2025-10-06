const Redis = require('ioredis');
const { getRedisConfig } = require('../config/redis');

class RedisService {
    constructor(config = {}) {
        // Use provided config or get from environment
        const redisConfig = Object.keys(config).length > 0 ? config : getRedisConfig();
        this.redis = new Redis(redisConfig);
        this.status = 'disconnected';
        
        // Enhanced event handling
        this.redis.on('connect', () => { 
            this.status = 'connected';
            console.log('✅ RedisService: Connected to Redis');
        });
        
        this.redis.on('ready', () => {
            console.log('✅ RedisService: Ready for operations');
        });
        
        this.redis.on('error', (err) => { 
            this.status = 'error';
            console.error('❌ RedisService Error:', err?.message || err || 'Unknown error');
        });
        
        this.redis.on('close', () => {
            this.status = 'disconnected';
            console.log('🔒 RedisService: Connection closed');
        });
        
        this.redis.on('reconnecting', () => {
            console.log('🔄 RedisService: Reconnecting...');
        });
    }
    
    async get(key) {
        if (this.status !== 'connected') return null;
        return this.redis.get(key);
    }
    
    async set(key, value, ttl = 3600) {
        if (this.status !== 'connected') return;
        await this.redis.setex(key, ttl, JSON.stringify(value));
    }
    
    async disconnect() {
        if (this.redis) await this.redis.quit();
    }
    
    // ADAPTER: Add closeConnection to call disconnect for backward compatibility
    async closeConnection() {
        return this.disconnect();
    }
}

let singletonInstance = null;
const getSingleton = () => {
    if (!singletonInstance) {
        // Create singleton with proper config from environment
        singletonInstance = new RedisService(getRedisConfig());
    }
    return singletonInstance;
};

// The default export is the CLASS for old tests
module.exports = RedisService;
// The singleton instance is attached for new code
module.exports.singleton = getSingleton();
// A way to reset the singleton for tests
module.exports.closeRedisConnection = () => {
    if (singletonInstance) {
        singletonInstance.disconnect();
        singletonInstance = null;
    }
};

// Add a reset method for cleaner test cleanup
module.exports.resetInstance = () => {
    if (singletonInstance) {
        singletonInstance.disconnect();
        singletonInstance = null;
    }
};
// A test-only key to get the instance
if (process.env.NODE_ENV === 'test') {
    module.exports.getTestInstance = () => singletonInstance;
}