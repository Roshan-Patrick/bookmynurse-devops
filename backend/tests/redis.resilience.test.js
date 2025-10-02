const RedisService = require('../services/RedisService');

describe('Redis Connection Resilience', () => {
    it('should correctly update status when mock Redis emits events', () => {
        // The global mock is already an EventEmitter
        const service = new RedisService();
        const mockRedisInstance = service.redis;
        
        // Simulate a sequence of events
        mockRedisInstance.emit('connect');
        expect(service.status).toBe('connected');
        
        // Note: RedisService only handles 'connect' and 'error' events
        // 'reconnecting' event is not handled, so status remains 'connected'
        mockRedisInstance.emit('reconnecting');
        expect(service.status).toBe('connected'); // Status doesn't change
        
        mockRedisInstance.emit('error', new Error('Test Error'));
        expect(service.status).toBe('error');
    });
});