// Resilience Tests for Redis Connection
const RedisService = require('../services/RedisService');

describe('Redis Connection Resilience Tests', () => {
  let redisService;

  beforeEach(() => {
    redisService = new RedisService();
  });

  afterEach(async () => {
    if (redisService) {
      await redisService.disconnect();
    }
  });

  describe('Connection State Management', () => {
    it('should handle initial connection state', () => {
      expect(redisService.status).toBeDefined();
      expect(['connecting', 'connected', 'disconnected', 'error']).toContain(redisService.status);
    });

    it('should track connection status changes', async () => {
      const initialStatus = redisService.status;
      
      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalStatus = redisService.status;
      expect(finalStatus).toBeDefined();
    });

    it('should handle connection timeout gracefully', async () => {
      // Create Redis service with invalid configuration
      const invalidRedisService = new RedisService({
        host: 'invalid-host',
        port: 9999,
        connectTimeout: 1000,
        retryDelayOnFailover: 100
      });

      // Wait for connection attempt
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(invalidRedisService.status).toBe('error');
      await invalidRedisService.disconnect();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate connection error
      const error = new Error('Simulated Redis error');
      redisService.redis.emit('error', error);

      // Service should handle error gracefully
      expect(redisService.status).toBe('error');
    });

    it('should handle Redis close events', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate connection close
      redisService.redis.emit('close');

      // Service should update status
      expect(redisService.status).toBe('disconnected');
    });

    it('should handle Redis reconnecting events', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate reconnecting
      redisService.redis.emit('reconnecting');

      // Service should update status
      expect(redisService.status).toBe('reconnecting');
    });

    it('should handle Redis connect events', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate successful connection
      redisService.redis.emit('connect');

      // Service should update status
      expect(redisService.status).toBe('connected');
    });
  });

  describe('Operation Resilience', () => {
    it('should handle operations when disconnected', async () => {
      // Disconnect Redis
      await redisService.disconnect();

      // Operations should not throw errors
      const getResult = await redisService.get('test-key');
      const setResult = await redisService.set('test-key', { data: 'test' });
      const clearResult = await redisService.clear('test-key');

      expect(getResult).toBeNull();
      expect(setResult).toBeUndefined();
      expect(clearResult).toBe(0);
    });

    it('should handle operations when connection is in error state', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate error state
      redisService.status = 'error';

      // Operations should not throw errors
      const getResult = await redisService.get('test-key');
      const setResult = await redisService.set('test-key', { data: 'test' });
      const clearResult = await redisService.clear('test-key');

      expect(getResult).toBeNull();
      expect(setResult).toBeUndefined();
      expect(clearResult).toBe(0);
    });

    it('should handle operations when reconnecting', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate reconnecting state
      redisService.status = 'reconnecting';

      // Operations should not throw errors
      const getResult = await redisService.get('test-key');
      const setResult = await redisService.set('test-key', { data: 'test' });
      const clearResult = await redisService.clear('test-key');

      expect(getResult).toBeNull();
      expect(setResult).toBeUndefined();
      expect(clearResult).toBe(0);
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt reconnection after connection loss', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate connection loss
      redisService.redis.emit('close');

      // Service should be in disconnected state
      expect(redisService.status).toBe('disconnected');

      // Simulate reconnection attempt
      redisService.redis.emit('reconnecting');
      expect(redisService.status).toBe('reconnecting');

      // Simulate successful reconnection
      redisService.redis.emit('connect');
      expect(redisService.status).toBe('connected');
    });

    it('should handle multiple reconnection attempts', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate multiple connection issues
      for (let i = 0; i < 3; i++) {
        redisService.redis.emit('close');
        expect(redisService.status).toBe('disconnected');

        redisService.redis.emit('reconnecting');
        expect(redisService.status).toBe('reconnecting');

        redisService.redis.emit('connect');
        expect(redisService.status).toBe('connected');
      }
    });
  });

  describe('Statistics Resilience', () => {
    it('should maintain statistics during connection issues', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get initial stats
      const initialStats = redisService.getStats();

      // Simulate connection issues
      redisService.redis.emit('error', new Error('Connection error'));
      redisService.redis.emit('close');
      redisService.redis.emit('reconnecting');
      redisService.redis.emit('connect');

      // Get final stats
      const finalStats = redisService.getStats();

      // Stats should be maintained
      expect(finalStats).toHaveProperty('status');
      expect(finalStats).toHaveProperty('totalCacheHits');
      expect(finalStats).toHaveProperty('totalCacheMisses');
      expect(finalStats).toHaveProperty('hitRatio');
    });

    it('should reset statistics on clearAllCache', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate some cache activity
      await redisService.set('test-key', { data: 'test' });
      await redisService.get('test-key');
      await redisService.get('nonexistent-key');

      // Get stats before clear
      const statsBefore = redisService.getStats();

      // Clear all cache
      await redisService.clearAllCache();

      // Get stats after clear
      const statsAfter = redisService.getStats();

      // Statistics should be reset
      expect(statsAfter.totalCacheHits).toBe(0);
      expect(statsAfter.totalCacheMisses).toBe(0);
      expect(statsAfter.hitRatio).toBe('N/A');
    });
  });

  describe('Memory and Resource Management', () => {
    it('should properly clean up resources on disconnect', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Disconnect
      await redisService.disconnect();

      // Service should be in disconnected state
      expect(redisService.status).toBe('disconnected');
    });

    it('should handle multiple disconnect calls gracefully', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Multiple disconnect calls should not cause errors
      await redisService.disconnect();
      await redisService.disconnect();
      await redisService.disconnect();

      expect(redisService.status).toBe('disconnected');
    });

    it('should handle operations after disconnect', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Disconnect
      await redisService.disconnect();

      // Operations after disconnect should not throw errors
      const getResult = await redisService.get('test-key');
      const setResult = await redisService.set('test-key', { data: 'test' });
      const clearResult = await redisService.clear('test-key');
      const stats = redisService.getStats();

      expect(getResult).toBeNull();
      expect(setResult).toBeUndefined();
      expect(clearResult).toBe(0);
      expect(stats.status).toBe('disconnected');
    });
  });

  describe('Configuration Resilience', () => {
    it('should handle invalid Redis configuration', async () => {
      // Create Redis service with invalid configuration
      const invalidRedisService = new RedisService({
        host: 'nonexistent-host',
        port: 9999,
        connectTimeout: 1000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1
      });

      // Wait for connection attempt
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Service should handle invalid configuration gracefully
      expect(invalidRedisService.status).toBe('error');

      // Operations should not throw errors
      const getResult = await invalidRedisService.get('test-key');
      const setResult = await invalidRedisService.set('test-key', { data: 'test' });

      expect(getResult).toBeNull();
      expect(setResult).toBeUndefined();

      await invalidRedisService.disconnect();
    });

    it('should handle missing Redis configuration', async () => {
      // Create Redis service with minimal configuration
      const minimalRedisService = new RedisService({});

      // Wait for connection attempt
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Service should handle missing configuration gracefully
      expect(minimalRedisService.status).toBeDefined();

      await minimalRedisService.disconnect();
    });
  });

  describe('Concurrent Operations Resilience', () => {
    it('should handle concurrent operations during connection issues', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create concurrent operations
      const operations = Array(10).fill().map(async (_, i) => {
        // Simulate connection issue in the middle
        if (i === 5) {
          redisService.redis.emit('error', new Error('Connection error'));
        }

        return redisService.get(`test-key-${i}`);
      });

      // All operations should complete without throwing errors
      const results = await Promise.all(operations);

      // All results should be null (cache miss or connection issue)
      results.forEach(result => {
        expect(result).toBeNull();
      });
    });

    it('should handle concurrent set operations during connection issues', async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create concurrent set operations
      const operations = Array(10).fill().map(async (_, i) => {
        // Simulate connection issue in the middle
        if (i === 5) {
          redisService.redis.emit('close');
        }

        return redisService.set(`test-key-${i}`, { data: `test-${i}` });
      });

      // All operations should complete without throwing errors
      const results = await Promise.all(operations);

      // All operations should complete (even if they don't actually set data)
      expect(results).toHaveLength(10);
    });
  });
});
