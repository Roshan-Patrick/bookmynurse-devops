const RedisService = require('../services/RedisService');

// Tell Jest to use our MockIORedis whenever 'ioredis' is imported
jest.mock('ioredis', () => {
    const EventEmitter = require('events'); // REQUIRE inside the mock factory
    // Create a mock class that we can control by emitting events
    return class MockIORedis extends EventEmitter {
        constructor(config) {
            super();
            this.config = config;
            this.status = 'disconnected';
            // If lazyConnect is false, simulate an immediate connection attempt that fails
            if (config.lazyConnect === false) {
                process.nextTick(() => this.emit('error', new Error('Connection failed')));
            }
        }
        connect = jest.fn().mockResolvedValue(undefined);
        quit = jest.fn().mockResolvedValue('OK');
    };
});

describe('Redis Connection Resilience Tests', () => {
    let service;

    afterEach(async () => {
        if (service) {
            await service.disconnect();
        }
    });

    it('should handle invalid Redis configuration by entering an error state', () => {
        service = new RedisService({ host: 'invalid-host', lazyConnect: false });
        expect(service.status).toBe('error');
    });

    it('should transition from reconnecting to error state on timeout', () => {
        service = new RedisService({ lazyConnect: true });
        const mockRedisInstance = service.redis;
        mockRedisInstance.emit('reconnecting');
        expect(service.status).toBe('reconnecting');
        mockRedisInstance.emit('error', new Error('Connection timeout'));
        expect(service.status).toBe('error');
    });
});