// Unit Tests for Redis Configuration
const RedisService = require('../services/RedisService');

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn()
  }));
});

describe('Redis Configuration Unit Tests', () => {
  let redisService;

  beforeEach(() => {
    jest.clearAllMocks();
    redisService = new RedisService();
  });

  afterEach(async () => {
    if (redisService) {
      await redisService.disconnect();
    }
  });

  describe('Redis Service Initialization', () => {
    it('should initialize Redis service with default configuration', () => {
      // Arrange & Act
      const service = new RedisService();

      // Assert
      expect(service).toBeDefined();
      expect(service.status).toBeDefined();
      expect(['connecting', 'connected', 'disconnected', 'error']).toContain(service.status);
    });

    it('should initialize Redis service with custom configuration', () => {
      // Arrange
      const customConfig = {
        host: 'custom-host',
        port: 6380,
        password: 'custom-password',
        connectTimeout: 5000,
        retryDelayOnFailover: 200
      };

      // Act
      const service = new RedisService(customConfig);

      // Assert
      expect(service).toBeDefined();
      expect(service.status).toBeDefined();
    });

    it('should handle Redis connection errors gracefully', () => {
      // Arrange
      const invalidConfig = {
        host: 'invalid-host',
        port: 9999,
        connectTimeout: 1000,
        retryDelayOnFailover: 100,
        lazyConnect: false
      };

      // Act
      const service = new RedisService(invalidConfig);

      // Simulate the error event that should be emitted
      service.redis.emit('error', new Error('Connection failed'));

      // Assert
      expect(service.status).toBe('error');
    });
  });

  describe('Redis Connection Management', () => {
    it('should handle connection events', () => {
      // Arrange
      const mockRedis = redisService.redis;

      // Act
      // Simulate connection events
      const connectHandler = mockRedis.on.mock.calls.find(call => call[0] === 'connect')[1];
      const errorHandler = mockRedis.on.mock.calls.find(call => call[0] === 'error')[1];
      const closeHandler = mockRedis.on.mock.calls.find(call => call[0] === 'close')[1];
      const reconnectingHandler = mockRedis.on.mock.calls.find(call => call[0] === 'reconnecting')[1];

      // Assert
      expect(connectHandler).toBeDefined();
      expect(errorHandler).toBeDefined();
      expect(closeHandler).toBeDefined();
      expect(reconnectingHandler).toBeDefined();
    });

    it('should update status on connect event', () => {
      // Arrange
      const mockRedis = redisService.redis;
      const connectHandler = mockRedis.on.mock.calls.find(call => call[0] === 'connect')[1];

      // Act
      connectHandler();

      // Assert
      expect(redisService.status).toBe('connected');
    });

    it('should update status on error event', () => {
      // Arrange
      const mockRedis = redisService.redis;
      const errorHandler = mockRedis.on.mock.calls.find(call => call[0] === 'error')[1];
      const error = new Error('Connection failed');

      // Act
      errorHandler(error);

      // Assert
      expect(redisService.status).toBe('error');
    });

    it('should update status on close event', () => {
      // Arrange
      const mockRedis = redisService.redis;
      const closeHandler = mockRedis.on.mock.calls.find(call => call[0] === 'close')[1];

      // Act
      closeHandler();

      // Assert
      expect(redisService.status).toBe('disconnected');
    });

    it('should update status on reconnecting event', () => {
      // Arrange
      const mockRedis = redisService.redis;
      const reconnectingHandler = mockRedis.on.mock.calls.find(call => call[0] === 'reconnecting')[1];

      // Act
      reconnectingHandler();

      // Assert
      expect(redisService.status).toBe('reconnecting');
    });
  });

  describe('Redis Operations', () => {
    it('should handle set operation when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      await redisService.set('test-key', { data: 'test' }, 300);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify({ data: 'test' }));
    });

    it('should skip set operation when disconnected', async () => {
      // Arrange
      redisService.status = 'disconnected';
      const mockRedis = redisService.redis;

      // Act
      await redisService.set('test-key', { data: 'test' });

      // Assert
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should handle get operation when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      const cachedData = JSON.stringify({ data: 'test' });
      mockRedis.get.mockResolvedValue(cachedData);

      // Act
      const result = await redisService.get('test-key');

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual({ data: 'test' });
      expect(redisService.totalCacheHits).toBe(1);
    });

    it('should return null for cache miss', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      mockRedis.get.mockResolvedValue(null);

      // Act
      const result = await redisService.get('test-key');

      // Assert
      expect(result).toBeNull();
      expect(redisService.totalCacheMisses).toBe(1);
    });

    it('should skip get operation when disconnected', async () => {
      // Arrange
      redisService.status = 'disconnected';
      const mockRedis = redisService.redis;

      // Act
      const result = await redisService.get('test-key');

      // Assert
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('Redis Error Handling', () => {
    it('should handle Redis operation errors gracefully', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      const error = new Error('Redis operation failed');
      mockRedis.setex.mockRejectedValue(error);

      // Act
      await redisService.set('test-key', { data: 'test' });

      // Assert
      expect(mockRedis.setex).toHaveBeenCalled();
      // Should not throw error
    });

    it('should handle Redis get errors gracefully', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      const error = new Error('Redis get failed');
      mockRedis.get.mockRejectedValue(error);

      // Act
      const result = await redisService.get('test-key');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle Redis clear errors gracefully', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      const error = new Error('Redis clear failed');
      mockRedis.del.mockRejectedValue(error);

      // Act
      const result = await redisService.clear('test-key');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('Redis Statistics', () => {
    it('should track cache hits and misses correctly', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' })); // Hit
      mockRedis.get.mockResolvedValueOnce(null); // Miss

      // Act
      await redisService.get('test-key'); // Hit
      await redisService.get('test-key'); // Miss

      // Assert
      expect(redisService.totalCacheHits).toBe(1);
      expect(redisService.totalCacheMisses).toBe(1);
    });

    it('should calculate hit ratio correctly', () => {
      // Arrange
      redisService.totalCacheHits = 8;
      redisService.totalCacheMisses = 2;

      // Act
      const stats = redisService.getStats();

      // Assert
      expect(stats.hitRatio).toBe('0.80');
    });

    it('should return N/A hit ratio when no operations', () => {
      // Arrange
      redisService.totalCacheHits = 0;
      redisService.totalCacheMisses = 0;

      // Act
      const stats = redisService.getStats();

      // Assert
      expect(stats.hitRatio).toBe('N/A');
    });
  });

  describe('Redis Cleanup', () => {
    it('should disconnect successfully when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      mockRedis.quit.mockResolvedValue('OK');

      // Act
      await redisService.disconnect();

      // Assert
      expect(mockRedis.quit).toHaveBeenCalled();
      expect(redisService.status).toBe('disconnected');
    });

    it('should handle disconnect when already disconnected', async () => {
      // Arrange
      redisService.status = 'disconnected';
      const mockRedis = redisService.redis;

      // Act
      await redisService.disconnect();

      // Assert
      expect(mockRedis.quit).not.toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      // Arrange
      redisService.status = 'connected';
      const mockRedis = redisService.redis;
      const error = new Error('Disconnect failed');
      mockRedis.quit.mockRejectedValue(error);

      // Act
      await redisService.disconnect();

      // Assert - should not throw, should handle gracefully
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });

  describe('Redis Configuration Validation', () => {
    it('should handle missing Redis configuration', () => {
      // Arrange
      const originalEnv = process.env;
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;

      // Act
      const service = new RedisService();

      // Assert
      expect(service).toBeDefined();
      expect(service.status).toBeDefined();

      // Restore environment
      process.env = originalEnv;
    });

    it('should handle invalid Redis port', () => {
      // Arrange
      const invalidConfig = {
        host: 'localhost',
        port: 'invalid-port',
        password: 'test-password'
      };

      // Act
      const service = new RedisService(invalidConfig);

      // Assert
      expect(service).toBeDefined();
      expect(service.status).toBeDefined();
    });

    it('should handle missing Redis password', () => {
      // Arrange
      const configWithoutPassword = {
        host: 'localhost',
        port: 6379
      };

      // Act
      const service = new RedisService(configWithoutPassword);

      // Assert
      expect(service).toBeDefined();
      expect(service.status).toBeDefined();
    });
  });
});
