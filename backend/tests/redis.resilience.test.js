const RedisService = require('../services/RedisService');
const EventEmitter = require('events');

// Tell Jest to use our MockIORedis whenever 'ioredis' is imported
jest.mock('ioredis', () => {
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
        get = jest.fn();
        setex = jest.fn();
        del = jest.fn();
        flushdb = jest.fn();
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
        // Arrange: Create a service with an invalid host and non-lazy connect.
        // The mock constructor will see lazyConnect:false and immediately emit an 'error'.
        service = new RedisService({ host: 'invalid-host', lazyConnect: false });

        // Assert: The service's 'error' listener should have set the status correctly.
        expect(service.status).toBe('error');
    });

    it('should handle a timeout by moving from reconnecting to error state', () => {
        // Arrange
        service = new RedisService({ lazyConnect: true });
        const mockRedisInstance = service.redis;

        // Act: Simulate the event lifecycle of a failed reconnection
        mockRedisInstance.emit('reconnecting');
        expect(service.status).toBe('reconnecting');
        mockRedisInstance.emit('error', new Error('Connection timeout'));

        // Assert: The service should now be in a permanent error state.
        expect(service.status).toBe('error');
  });
});
