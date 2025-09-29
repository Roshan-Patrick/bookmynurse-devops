// Unit Tests for Redis Service
const RedisService = require('./RedisService');

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

describe('Redis Service Unit Tests', () => {
  let redisService;
  let mockRedis;

  beforeEach(() => {
    jest.clearAllMocks();
    redisService = new RedisService();
    mockRedis = redisService.redis;
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache key for same parameters', () => {
      // Arrange
      const endpoint = 'getBookings';
      const params = { page: 1, limit: 10, status: 'active' };

      // Act
      const key1 = redisService.generateCacheKey(endpoint, params);
      const key2 = redisService.generateCacheKey(endpoint, params);

      // Assert
      expect(key1).toBe(key2);
      expect(key1).toContain('getBookings:');
    });

    it('should generate different cache keys for different parameters', () => {
      // Arrange
      const endpoint = 'getBookings';
      const params1 = { page: 1, limit: 10 };
      const params2 = { page: 2, limit: 10 };

      // Act
      const key1 = redisService.generateCacheKey(endpoint, params1);
      const key2 = redisService.generateCacheKey(endpoint, params2);

      // Assert
      expect(key1).not.toBe(key2);
    });

    it('should handle empty parameters', () => {
      // Arrange
      const endpoint = 'getBookings';
      const params = {};

      // Act
      const key = redisService.generateCacheKey(endpoint, params);

      // Assert
      expect(key).toContain('getBookings:');
      expect(key).toBeDefined();
    });
  });

  describe('set', () => {
    it('should set cache data successfully when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      const key = 'test:key';
      const data = { id: 1, name: 'Test' };
      const ttl = 300;
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      await redisService.set(key, data, ttl);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith(key, ttl, JSON.stringify(data));
    });

    it('should skip cache set when not connected', async () => {
      // Arrange
      redisService.status = 'disconnected';
      const key = 'test:key';
      const data = { id: 1, name: 'Test' };

      // Act
      await redisService.set(key, data);

      // Assert
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      redisService.status = 'connected';
      const key = 'test:key';
      const data = { id: 1, name: 'Test' };
      const error = new Error('Redis connection failed');
      mockRedis.setex.mockRejectedValue(error);

      // Act
      await redisService.set(key, data);

      // Assert
      expect(mockRedis.setex).toHaveBeenCalledWith(key, 300, JSON.stringify(data));
    });
  });

  describe('get', () => {
    it('should get cache data successfully when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      const key = 'test:key';
      const cachedData = JSON.stringify({ id: 1, name: 'Test' });
      mockRedis.get.mockResolvedValue(cachedData);

      // Act
      const result = await redisService.get(key);

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(redisService.totalCacheHits).toBe(1);
    });

    it('should return null for cache miss', async () => {
      // Arrange
      redisService.status = 'connected';
      const key = 'test:key';
      mockRedis.get.mockResolvedValue(null);

      // Act
      const result = await redisService.get(key);

      // Assert
      expect(result).toBeNull();
      expect(redisService.totalCacheMisses).toBe(1);
    });

    it('should skip cache get when not connected', async () => {
      // Arrange
      redisService.status = 'disconnected';
      const key = 'test:key';

      // Act
      const result = await redisService.get(key);

      // Assert
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      redisService.status = 'connected';
      const key = 'test:key';
      const error = new Error('Redis connection failed');
      mockRedis.get.mockRejectedValue(error);

      // Act
      const result = await redisService.get(key);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear specific key successfully when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      const key = 'test:key';
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await redisService.clear(key);

      // Assert
      expect(mockRedis.del).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    it('should skip cache clear when not connected', async () => {
      // Arrange
      redisService.status = 'disconnected';
      const key = 'test:key';

      // Act
      const result = await redisService.clear(key);

      // Assert
      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      redisService.status = 'connected';
      const key = 'test:key';
      const error = new Error('Redis connection failed');
      mockRedis.del.mockRejectedValue(error);

      // Act
      const result = await redisService.clear(key);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('clearByPattern', () => {
    it('should clear keys by pattern successfully when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      const pattern = 'bookings:*';
      const keys = ['bookings:1', 'bookings:2'];
      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(2);

      // Act
      const result = await redisService.clearByPattern(pattern);

      // Assert
      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
      expect(result).toBe(2);
    });

    it('should handle no keys found', async () => {
      // Arrange
      redisService.status = 'connected';
      const pattern = 'nonexistent:*';
      mockRedis.keys.mockResolvedValue([]);

      // Act
      const result = await redisService.clearByPattern(pattern);

      // Assert
      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should skip cache clear by pattern when not connected', async () => {
      // Arrange
      redisService.status = 'disconnected';
      const pattern = 'bookings:*';

      // Act
      const result = await redisService.clearByPattern(pattern);

      // Assert
      expect(mockRedis.keys).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cache successfully when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      mockRedis.flushdb.mockResolvedValue('OK');

      // Act
      const result = await redisService.clearAllCache();

      // Assert
      expect(mockRedis.flushdb).toHaveBeenCalled();
      expect(result).toBe('OK');
      expect(redisService.totalCacheHits).toBe(0);
      expect(redisService.totalCacheMisses).toBe(0);
    });

    it('should skip clear all cache when not connected', async () => {
      // Arrange
      redisService.status = 'disconnected';

      // Act
      const result = await redisService.clearAllCache();

      // Assert
      expect(mockRedis.flushdb).not.toHaveBeenCalled();
      expect(result).toBe('Redis not connected');
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      redisService.status = 'connected';
      const error = new Error('Redis connection failed');
      mockRedis.flushdb.mockRejectedValue(error);

      // Act
      const result = await redisService.clearAllCache();

      // Assert
      expect(result).toBe('Error');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      // Arrange
      redisService.status = 'connected';
      redisService.totalCacheHits = 10;
      redisService.totalCacheMisses = 5;

      // Act
      const stats = redisService.getStats();

      // Assert
      expect(stats).toEqual({
        status: 'connected',
        totalCacheHits: 10,
        totalCacheMisses: 5,
        hitRatio: '0.67'
      });
    });

    it('should return N/A hit ratio when no operations', () => {
      // Arrange
      redisService.status = 'connected';
      redisService.totalCacheHits = 0;
      redisService.totalCacheMisses = 0;

      // Act
      const stats = redisService.getStats();

      // Assert
      expect(stats.hitRatio).toBe('N/A');
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully when connected', async () => {
      // Arrange
      redisService.status = 'connected';
      mockRedis.quit.mockResolvedValue('OK');

      // Act
      await redisService.disconnect();

      // Assert
      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it('should disconnect successfully when reconnecting', async () => {
      // Arrange
      redisService.status = 'reconnecting';
      mockRedis.quit.mockResolvedValue('OK');

      // Act
      await redisService.disconnect();

      // Assert
      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it('should not disconnect when already disconnected', async () => {
      // Arrange
      redisService.status = 'disconnected';

      // Act
      await redisService.disconnect();

      // Assert
      expect(mockRedis.quit).not.toHaveBeenCalled();
    });
  });

  describe('Connection Events', () => {
    it('should handle connect event', () => {
      // Arrange
      const connectHandler = mockRedis.on.mock.calls.find(call => call[0] === 'connect')[1];

      // Act
      connectHandler();

      // Assert
      expect(redisService.status).toBe('connected');
    });

    it('should handle error event', () => {
      // Arrange
      const errorHandler = mockRedis.on.mock.calls.find(call => call[0] === 'error')[1];
      const error = new Error('Connection failed');

      // Act
      errorHandler(error);

      // Assert
      expect(redisService.status).toBe('error');
    });

    it('should handle close event', () => {
      // Arrange
      const closeHandler = mockRedis.on.mock.calls.find(call => call[0] === 'close')[1];

      // Act
      closeHandler();

      // Assert
      expect(redisService.status).toBe('disconnected');
    });

    it('should handle reconnecting event', () => {
      // Arrange
      const reconnectingHandler = mockRedis.on.mock.calls.find(call => call[0] === 'reconnecting')[1];

      // Act
      reconnectingHandler();

      // Assert
      expect(redisService.status).toBe('reconnecting');
    });
  });
});
