const RedisService = require('../services/RedisService');

jest.mock('ioredis', () => {
    const EventEmitter = require('events');
    return class MockIORedis extends EventEmitter {
        constructor(config) {
            super();
            if (config.lazyConnect === false) {
                process.nextTick(() => this.emit('error', new Error('Connection failed')));
            }
        }
        quit = jest.fn().mockResolvedValue('OK');
    };
});

describe('Redis Connection Resilience Tests', () => {
    it('should handle invalid Redis configuration by entering an error state', () => {
        const service = new RedisService({ host: 'invalid-host', lazyConnect: false });
        expect(service.status).toBe('error');
    });
});