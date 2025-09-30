const RedisService = require('../services/RedisService');

// Mock ioredis, requiring EventEmitter INSIDE the factory to avoid hoisting issues
jest.mock('ioredis', () => {
    const EventEmitter = require('events');
    return class MockIORedis extends EventEmitter {
        constructor() {
            super();
            this.quit = jest.fn().mockResolvedValue('OK');
        }
    };
});

describe('Redis Configuration Unit Tests', () => {
    it('should handle Redis connection errors gracefully', () => {
        // Arrange
        const service = new RedisService({ lazyConnect: true });
        // Act: Manually emit an error from the mock instance
        service.redis.emit('error', new Error('Connection failed'));
        // Assert
        expect(service.status).toBe('error');
    });

    it('should handle disconnect errors gracefully', async () => {
        // Arrange
        const service = new RedisService();
        service.status = 'connected';
        service.redis.quit.mockRejectedValue(new Error('Disconnect failed'));
        // Act & Assert: The disconnect method should catch the error and not throw
        await expect(service.disconnect()).resolves.not.toThrow();
    });
});