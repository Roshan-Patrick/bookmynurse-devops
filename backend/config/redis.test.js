const RedisService = require('../services/RedisService');
const EventEmitter = require('events');

jest.mock('ioredis', () => {
    return class MockIORedis extends EventEmitter {
        constructor() { 
            super(); 
            this.quit = jest.fn(); 
        }
    }
});

describe('Redis Configuration Unit Tests', () => {
    it('should handle Redis connection errors gracefully', () => {
        const service = new RedisService({ lazyConnect: true });
        service.redis.emit('error', new Error('Connection failed'));
        expect(service.status).toBe('error');
    });

    it('should handle disconnect errors gracefully', async () => {
        const service = new RedisService();
        service.status = 'connected';
        service.redis.quit.mockRejectedValue(new Error('Disconnect failed'));
        await expect(service.disconnect()).resolves.not.toThrow();
    });
});