// Performance Tests for Redis Caching
const request = require('supertest');
const express = require('express');
const nursingRoutes = require('../routes/nursing.routes');

// Mock RedisService
jest.mock('../services/RedisService');
const RedisService = require('../services/RedisService');

// Mock database
jest.mock('../config/db', () => ({
  query: jest.fn()
}));
const db = require('../config/db');

// Mock the auth middleware for performance tests
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
});

// Create a dummy Express app to test routes
const app = express();
app.use(express.json());
app.use('/api/nursing', nursingRoutes);

describe('Redis Performance Tests', () => {
  let redisService;

  beforeAll(async () => {
    // Mock database responses
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT * FROM bookings')) {
        return Promise.resolve([{ id: 1, name: 'John Doe', mobile: '1234567890' }]);
      }
      if (sql.includes('INSERT INTO bookings')) {
        return Promise.resolve({ insertId: 1 });
      }
      return Promise.resolve([]);
    });

           // Mock Redis service
           const mockRedisService = {
             get: jest.fn().mockResolvedValue(null),
             set: jest.fn().mockResolvedValue(true),
             clear: jest.fn().mockResolvedValue(true),
             clearByPattern: jest.fn().mockResolvedValue(true),
             clearAllCache: jest.fn().mockResolvedValue(true),
             getStats: jest.fn().mockReturnValue({
               status: 'connected',
               totalCacheHits: 0,
               totalCacheMisses: 0,
               hitRatio: 'N/A'
             }),
             disconnect: jest.fn().mockResolvedValue(true)
           };
    
    RedisService.mockImplementation(() => mockRedisService);
    redisService = mockRedisService;
  });

  afterAll(async () => {
    await redisService.disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await redisService.clearAllCache();
  });

  describe('Cache Performance Benchmarks', () => {
    it('should measure cache hit vs miss performance', async () => {
      const iterations = 10;
      let totalMissTime = 0;
      let totalHitTime = 0;

      // Warm up the cache
      await request(app).get('/api/nursing/getBookings');

      // Measure cache miss performance
      for (let i = 0; i < iterations; i++) {
        await redisService.clearAllCache(); // Force cache miss
        
        const start = Date.now();
        await request(app).get('/api/nursing/getBookings');
        const end = Date.now();
        
        totalMissTime += (end - start);
      }

      // Measure cache hit performance
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app).get('/api/nursing/getBookings');
        const end = Date.now();
        
        totalHitTime += (end - start);
      }

      const avgMissTime = totalMissTime / iterations;
      const avgHitTime = totalHitTime / iterations;

      console.log(`Average Cache Miss Time: ${avgMissTime.toFixed(2)}ms`);
      console.log(`Average Cache Hit Time: ${avgHitTime.toFixed(2)}ms`);
      console.log(`Performance Improvement: ${((avgMissTime - avgHitTime) / avgMissTime * 100).toFixed(2)}%`);

      // Cache hit should be faster than cache miss
      expect(avgHitTime).toBeLessThan(avgMissTime);
      
      // Performance improvement should be significant (at least 10%)
      const improvement = (avgMissTime - avgHitTime) / avgMissTime;
      expect(improvement).toBeGreaterThan(0.1);
    });

    it('should measure cache performance with different query parameters', async () => {
      const queries = [
        '/api/nursing/getBookings',
        '/api/nursing/getBookings?approval_status=Pending',
        '/api/nursing/getBookings?approval_status=Approved',
        '/api/nursing/getBookings?approval_status=Ongoing'
      ];

      const results = {};

      for (const query of queries) {
        // Clear cache and measure miss
        await redisService.clearAllCache();
        const missStart = Date.now();
        await request(app).get(query);
        const missTime = Date.now() - missStart;

        // Measure hit
        const hitStart = Date.now();
        await request(app).get(query);
        const hitTime = Date.now() - hitStart;

        results[query] = {
          missTime,
          hitTime,
          improvement: ((missTime - hitTime) / missTime * 100).toFixed(2)
        };

        console.log(`Query: ${query}`);
        console.log(`  Miss: ${missTime}ms, Hit: ${hitTime}ms, Improvement: ${results[query].improvement}%`);
      }

      // All queries should show performance improvement
      Object.values(results).forEach(result => {
        expect(result.hitTime).toBeLessThan(result.missTime);
      });
    });

    it('should measure cache performance under load', async () => {
      const concurrentRequests = 20;
      const requestsPerBatch = 5;

      // Warm up cache
      await request(app).get('/api/nursing/getBookings');

      const results = [];

      for (let batch = 0; batch < concurrentRequests / requestsPerBatch; batch++) {
        const promises = Array(requestsPerBatch).fill().map(async () => {
          const start = Date.now();
          const res = await request(app).get('/api/nursing/getBookings');
          const end = Date.now();
          
          return {
            status: res.statusCode,
            time: end - start
          };
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      }

      // Calculate statistics
      const times = results.map(r => r.time);
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.log(`Load Test Results (${concurrentRequests} concurrent requests):`);
      console.log(`  Average Response Time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Min Response Time: ${minTime}ms`);
      console.log(`  Max Response Time: ${maxTime}ms`);

      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
      });

      // Average response time should be reasonable (less than 1000ms)
      expect(avgTime).toBeLessThan(1000);
    });

    it('should measure cache invalidation performance impact', async () => {
      // Warm up cache
      await request(app).get('/api/nursing/getBookings');
      await request(app).get('/api/nursing/getBookings?approval_status=Pending');

      // Measure cached response time
      const cachedStart = Date.now();
      await request(app).get('/api/nursing/getBookings');
      const cachedTime = Date.now() - cachedStart;

      // Create a booking to invalidate cache
      const bookingData = {
        name: 'Performance Test User',
        mobile: '5555555555',
        nurseType: 'RN',
        location: 'Performance Test City',
        services: 'General Care',
        preferences: 'Day Shift',
        enquiryno: 'PERF001'
      };

      const createStart = Date.now();
      await request(app)
        .post('/api/nursing/bookings')
        .send(bookingData);
      const createTime = Date.now() - createStart;

      // Measure response time after cache invalidation
      const invalidatedStart = Date.now();
      await request(app).get('/api/nursing/getBookings');
      const invalidatedTime = Date.now() - invalidatedStart;

      console.log(`Cache Invalidation Performance Impact:`);
      console.log(`  Cached Response Time: ${cachedTime}ms`);
      console.log(`  Cache Invalidation Time: ${createTime}ms`);
      console.log(`  Post-Invalidation Response Time: ${invalidatedTime}ms`);

      // Cached response should be fastest
      expect(cachedTime).toBeLessThan(invalidatedTime);
      
      // Cache invalidation should not take too long
      expect(createTime).toBeLessThan(2000);
    });

    it('should measure cache memory usage', async () => {
      // Clear cache and get initial stats
      await redisService.clearAllCache();
      const initialStats = redisService.getStats();

      // Generate cache entries
      const queries = [
        '/api/nursing/getBookings',
        '/api/nursing/getBookings?approval_status=Pending',
        '/api/nursing/getBookings?approval_status=Approved',
        '/api/nursing/getBookings?approval_status=Ongoing',
        '/api/nursing/getBookings?approval_status=Complete'
      ];

      for (const query of queries) {
        await request(app).get(query);
      }

      // Get final stats
      const finalStats = redisService.getStats();

      console.log(`Cache Memory Usage:`);
      console.log(`  Initial Cache Hits: ${initialStats.totalCacheHits}`);
      console.log(`  Final Cache Hits: ${finalStats.totalCacheHits}`);
      console.log(`  Cache Misses: ${finalStats.totalCacheMisses}`);
      console.log(`  Hit Ratio: ${finalStats.hitRatio}`);

      // Should have generated cache entries
      expect(finalStats.totalCacheMisses).toBeGreaterThan(0);
      expect(finalStats.totalCacheHits).toBeGreaterThan(0);
    });

    it('should measure cache TTL performance', async () => {
      // Test cache expiration behavior
      const start = Date.now();
      await request(app).get('/api/nursing/getBookings');
      const firstRequestTime = Date.now() - start;

      // Wait a bit and make another request
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const start2 = Date.now();
      await request(app).get('/api/nursing/getBookings');
      const secondRequestTime = Date.now() - start2;

      console.log(`Cache TTL Performance:`);
      console.log(`  First Request Time: ${firstRequestTime}ms`);
      console.log(`  Second Request Time: ${secondRequestTime}ms`);

      // Second request should be faster (cache hit)
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime);
    });
  });

  describe('Cache Scalability Tests', () => {
    it('should handle large number of cache entries', async () => {
      const numEntries = 100;
      const start = Date.now();

      // Generate many cache entries
      for (let i = 0; i < numEntries; i++) {
        await request(app).get(`/api/nursing/getBookings?page=${i}&limit=10`);
      }

      const generationTime = Date.now() - start;

      // Test cache hits
      const hitStart = Date.now();
      for (let i = 0; i < numEntries; i++) {
        await request(app).get(`/api/nursing/getBookings?page=${i}&limit=10`);
      }
      const hitTime = Date.now() - hitStart;

      console.log(`Cache Scalability Test (${numEntries} entries):`);
      console.log(`  Generation Time: ${generationTime}ms`);
      console.log(`  Hit Time: ${hitTime}ms`);
      console.log(`  Performance Ratio: ${(generationTime / hitTime).toFixed(2)}x faster`);

      // Cache hits should be significantly faster
      expect(hitTime).toBeLessThan(generationTime);
    });

    it('should handle cache pattern clearing performance', async () => {
      // Generate cache entries
      for (let i = 0; i < 50; i++) {
        await request(app).get(`/api/nursing/getBookings?page=${i}&limit=10`);
      }

      // Measure pattern clearing performance
      const start = Date.now();
      await redisService.clearByPattern('bookings:*');
      const clearTime = Date.now() - start;

      console.log(`Cache Pattern Clearing Time: ${clearTime}ms`);

      // Pattern clearing should be reasonably fast
      expect(clearTime).toBeLessThan(5000);
    });
  });
});
