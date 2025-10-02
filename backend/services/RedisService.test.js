const RedisService = require('./RedisService');
const Redis = require('ioredis');

describe('Redis Service', () => {
    let service;
    let mockRedisInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        // Create a new service, which will get a fresh mock from our global setup
        service = new RedisService();
        mockRedisInstance = service.redis; // Get the mock instance used by the service
    });

    it('should not call get if not connected', async () => {
        // Reset the status to disconnected
        service.status = 'disconnected';
        
        const result = await service.get('my-key');
        
        expect(mockRedisInstance.get).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should call get if connected', async () => {
        // Set status to connected
        service.status = 'connected';
        mockRedisInstance.get.mockResolvedValue('test-value');
        
        const result = await service.get('my-key');
        
        expect(mockRedisInstance.get).toHaveBeenCalledWith('my-key');
        expect(result).toBe('test-value');
    });

    it('should set key-value pairs when connected', async () => {
        service.status = 'connected';
        
        await service.set('test-key', { data: 'test' }, 3600);
        
        expect(mockRedisInstance.setex).toHaveBeenCalledWith('test-key', 3600, '{"data":"test"}');
    });

    it('should not set key-value pairs when not connected', async () => {
        service.status = 'disconnected';
        
        await service.set('test-key', { data: 'test' }, 3600);
        
        expect(mockRedisInstance.setex).not.toHaveBeenCalled();
    });

    it('should disconnect properly', async () => {
        await service.disconnect();
        
        expect(mockRedisInstance.quit).toHaveBeenCalled();
    });

    it('should support backward compatibility with closeConnection', async () => {
        await service.closeConnection();
        
        expect(mockRedisInstance.quit).toHaveBeenCalled();
    });

    it('should update status on connect event', () => {
        expect(service.status).toBe('disconnected');
        
        mockRedisInstance.emit('connect');
        
        expect(service.status).toBe('connected');
    });

    it('should update status on error event', () => {
        expect(service.status).toBe('disconnected');
        
        mockRedisInstance.emit('error');
        
        expect(service.status).toBe('error');
    });
});
