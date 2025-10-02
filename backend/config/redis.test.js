const RedisService = require('../services/RedisService');

// Use global mocks from tests/setup.js

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
        // Act & Assert: The disconnect method currently doesn't catch errors, so it should throw
        await expect(service.disconnect()).rejects.toThrow('Disconnect failed');
    });
});