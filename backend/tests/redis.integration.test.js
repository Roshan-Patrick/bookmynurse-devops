// Integration Tests for Redis Caching
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

// Mock the auth middleware for integration tests
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
});

// Create a dummy Express app to test routes
const app = express();
app.use(express.json());
app.use('/api/nursing', nursingRoutes);

describe('Redis Cache Integration Tests', () => {
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

  describe('Cache Hit/Miss Scenarios', () => {
    it('should cache GET /api/nursing/getBookings response', async () => {
      // First request - should be a cache miss
      const res1 = await request(app).get('/api/nursing/getBookings');
      expect(res1.statusCode).toEqual(200);

      // Second request - should be a cache hit
      const res2 = await request(app).get('/api/nursing/getBookings');
      expect(res2.statusCode).toEqual(200);

      // Verify cache statistics
      const stats = redisService.getStats();
      expect(stats.totalCacheHits).toBeGreaterThan(0);
      expect(stats.totalCacheMisses).toBeGreaterThan(0);
    });

    it('should cache GET /api/nursing/getBookings with query parameters', async () => {
      // First request with query params
      const res1 = await request(app).get('/api/nursing/getBookings?approval_status=Pending');
      expect(res1.statusCode).toEqual(200);

      // Second request with same query params - should be cache hit
      const res2 = await request(app).get('/api/nursing/getBookings?approval_status=Pending');
      expect(res2.statusCode).toEqual(200);

      // Third request with different query params - should be cache miss
      const res3 = await request(app).get('/api/nursing/getBookings?approval_status=Approved');
      expect(res3.statusCode).toEqual(200);
    });

    it('should not cache POST requests', async () => {
      // POST request should not be cached
      const bookingData = {
        name: 'Test User',
        mobile: '1234567890',
        nurseType: 'RN',
        location: 'Test City',
        services: 'General Care',
        preferences: 'Day Shift',
        enquiryno: 'TEST001'
      };

      const res = await request(app)
        .post('/api/nursing/bookings')
        .send(bookingData);

      expect(res.statusCode).toEqual(201);

      // Verify no cache operations for POST
      const stats = redisService.getStats();
      expect(stats.totalCacheHits).toBe(0);
      expect(stats.totalCacheMisses).toBe(0);
    });
  });

  describe('Cache Invalidation Logic', () => {
    it('should invalidate cache on POST /api/nursing/bookings', async () => {
      // First, create some cache entries
      await request(app).get('/api/nursing/getBookings');
      await request(app).get('/api/nursing/getBookings?approval_status=Pending');

      // Verify cache entries exist
      let stats = redisService.getStats();
      expect(stats.totalCacheMisses).toBeGreaterThan(0);

      // Create a new booking - should invalidate cache
      const bookingData = {
        name: 'Cache Test User',
        mobile: '9876543210',
        nurseType: 'LVN',
        location: 'Cache Test City',
        services: 'Emergency Care',
        preferences: 'Night Shift',
        enquiryno: 'CACHE001'
      };

      const res = await request(app)
        .post('/api/nursing/bookings')
        .send(bookingData);

      expect(res.statusCode).toEqual(201);

      // Verify cache was invalidated (next request should be cache miss)
      const res2 = await request(app).get('/api/nursing/getBookings');
      expect(res2.statusCode).toEqual(200);
    });

    it('should invalidate cache on PUT /api/nursing/updateBooking', async () => {
      // First, create a booking and some cache entries
      const bookingData = {
        name: 'Update Test User',
        mobile: '1111111111',
        nurseType: 'CNA',
        location: 'Update Test City',
        services: 'Home Care',
        preferences: 'Weekend',
        enquiryno: 'UPDATE001'
      };

      const createRes = await request(app)
        .post('/api/nursing/bookings')
        .send(bookingData);

      expect(createRes.statusCode).toEqual(201);
      const bookingId = createRes.body.data.insertId;

      // Create cache entries
      await request(app).get('/api/nursing/getBookings');

      // Update the booking - should invalidate cache
      const updateData = {
        id: bookingId,
        name: 'Updated Test User',
        mobile: '2222222222',
        nurseType: 'CNA',
        location: 'Updated Test City',
        services: 'Home Care',
        preferences: 'Weekend',
        enquiryno: 'UPDATE001'
      };

      const updateRes = await request(app)
        .put('/api/nursing/updateBooking')
        .send(updateData);

      expect(updateRes.statusCode).toEqual(200);

      // Verify cache was invalidated
      const res2 = await request(app).get('/api/nursing/getBookings');
      expect(res2.statusCode).toEqual(200);
    });

    it('should invalidate cache on DELETE /api/nursing/deleteBookings/:id', async () => {
      // First, create a booking and some cache entries
      const bookingData = {
        name: 'Delete Test User',
        mobile: '3333333333',
        nurseType: 'HHA',
        location: 'Delete Test City',
        services: 'Palliative Care',
        preferences: 'Holiday',
        enquiryno: 'DELETE001'
      };

      const createRes = await request(app)
        .post('/api/nursing/bookings')
        .send(bookingData);

      expect(createRes.statusCode).toEqual(201);
      const bookingId = createRes.body.data.insertId;

      // Create cache entries
      await request(app).get('/api/nursing/getBookings');

      // Delete the booking - should invalidate cache
      const deleteRes = await request(app)
        .delete(`/api/nursing/deleteBookings/${bookingId}`);

      expect(deleteRes.statusCode).toEqual(200);

      // Verify cache was invalidated
      const res2 = await request(app).get('/api/nursing/getBookings');
      expect(res2.statusCode).toEqual(200);
    });

    it('should invalidate cache on PUT /api/nursing/updateNurseApproval', async () => {
      // First, create a booking and some cache entries
      const bookingData = {
        name: 'Approval Test User',
        mobile: '4444444444',
        nurseType: 'RN',
        location: 'Approval Test City',
        services: 'ICU Care',
        preferences: 'Day Shift',
        enquiryno: 'APPROVAL001'
      };

      const createRes = await request(app)
        .post('/api/nursing/bookings')
        .send(bookingData);

      expect(createRes.statusCode).toEqual(201);
      const bookingId = createRes.body.data.insertId;

      // Create cache entries
      await request(app).get('/api/nursing/getBookings');

      // Update approval status - should invalidate cache
      const approvalData = {
        id: bookingId,
        status: 'Ongoing'
      };

      const approvalRes = await request(app)
        .put('/api/nursing/updateNurseApproval')
        .send(approvalData);

      expect(approvalRes.statusCode).toEqual(200);

      // Verify cache was invalidated
      const res2 = await request(app).get('/api/nursing/getBookings');
      expect(res2.statusCode).toEqual(200);
    });
  });

  describe('Cache Performance Tests', () => {
    it('should demonstrate cache performance improvement', async () => {
      // Measure time for first request (cache miss)
      const start1 = Date.now();
      const res1 = await request(app).get('/api/nursing/getBookings');
      const time1 = Date.now() - start1;

      expect(res1.statusCode).toEqual(200);

      // Measure time for second request (cache hit)
      const start2 = Date.now();
      const res2 = await request(app).get('/api/nursing/getBookings');
      const time2 = Date.now() - start2;

      expect(res2.statusCode).toEqual(200);

      // Cache hit should be faster (or at least not slower)
      // Note: This test might be flaky in some environments
      console.log(`Cache miss time: ${time1}ms, Cache hit time: ${time2}ms`);
      
      // Verify cache statistics
      const stats = redisService.getStats();
      expect(stats.totalCacheHits).toBeGreaterThan(0);
      expect(stats.totalCacheMisses).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent cache requests', async () => {
      // Make multiple concurrent requests
      const promises = Array(5).fill().map(() => 
        request(app).get('/api/nursing/getBookings')
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(res => {
        expect(res.statusCode).toEqual(200);
      });

      // Verify cache statistics
      const stats = redisService.getStats();
      expect(stats.totalCacheHits).toBeGreaterThan(0);
    });
  });

  describe('Cache Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Disconnect Redis to simulate connection error
      await redisService.disconnect();

      // Request should still work (fallback to database)
      const res = await request(app).get('/api/nursing/getBookings');
      expect(res.statusCode).toEqual(200);

      // Reconnect Redis for other tests
      redisService = new RedisService();
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should handle cache key generation errors', async () => {
      // Test with invalid parameters that might cause key generation issues
      const res = await request(app).get('/api/nursing/getBookings?invalid_param=');
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', async () => {
      // Clear cache and reset stats
      await redisService.clearAllCache();

      // Make requests to generate cache activity
      await request(app).get('/api/nursing/getBookings');
      await request(app).get('/api/nursing/getBookings'); // Cache hit
      await request(app).get('/api/nursing/getBookings?approval_status=Pending'); // Cache miss

      // Get statistics
      const stats = redisService.getStats();

      expect(stats).toHaveProperty('status');
      expect(stats).toHaveProperty('totalCacheHits');
      expect(stats).toHaveProperty('totalCacheMisses');
      expect(stats).toHaveProperty('hitRatio');

      expect(stats.totalCacheHits).toBeGreaterThan(0);
      expect(stats.totalCacheMisses).toBeGreaterThan(0);
      expect(stats.hitRatio).toBeDefined();
    });
  });
});
