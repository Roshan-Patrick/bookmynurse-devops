const request = require('supertest');
const express = require('express');
const nursingRoutes = require('../routes/nursing.routes');

// Mock RedisService with a stateful implementation
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
  let internalCache;

  beforeAll(() => {
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

    // Create a stateful mock for RedisService
    internalCache = new Map();
    const mockRedisService = {
      get: jest.fn(async (key) => {
        if (internalCache.has(key)) {
          mockRedisService.getStats.mock.hits++;
          return internalCache.get(key);
        }
        mockRedisService.getStats.mock.misses++;
        return null;
      }),
      set: jest.fn(async (key, value) => {
        internalCache.set(key, value);
      }),
      clearAllCache: jest.fn(async () => {
        internalCache.clear();
        mockRedisService.getStats.mock.hits = 0;
        mockRedisService.getStats.mock.misses = 0;
      }),
      clearByPattern: jest.fn(async (pattern) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of internalCache.keys()) {
          if (regex.test(key)) {
            internalCache.delete(key);
          }
        }
      }),
      getStats: jest.fn(() => ({
        status: 'connected',
        totalCacheHits: mockRedisService.getStats.mock.hits,
        totalCacheMisses: mockRedisService.getStats.mock.misses,
        hitRatio: (mockRedisService.getStats.mock.hits + mockRedisService.getStats.mock.misses > 0) ? 
                  (mockRedisService.getStats.mock.hits / (mockRedisService.getStats.mock.hits + mockRedisService.getStats.mock.misses)).toFixed(2) : 'N/A'
      })),
      disconnect: jest.fn().mockResolvedValue(true)
    };
    mockRedisService.getStats.mock.hits = 0;
    mockRedisService.getStats.mock.misses = 0;

    RedisService.mockImplementation(() => mockRedisService);
    redisService = mockRedisService;
  });

  afterAll(async () => {
    await redisService.disconnect();
  });

  beforeEach(async () => {
    // Clear cache and mocks before each test
    await redisService.clearAllCache();
    jest.clearAllMocks();
  });

  describe('Cache Hit/Miss Scenarios', () => {
    it('should cache GET /api/nursing/getBookings response', async () => {
        db.query.mockResolvedValue([[{ id: 1, name: 'Test' }]]);
        redisService.get.mockResolvedValueOnce(null); // First call is a miss
        redisService.get.mockResolvedValueOnce(JSON.stringify({ id: 1, name: 'Test' })); // Second call is a hit

        const res1 = await request(app).get('/api/nursing/getBookings');
        expect(res1.statusCode).toEqual(200);
        expect(redisService.set).toHaveBeenCalled();

        const res2 = await request(app).get('/api/nursing/getBookings');
        expect(res2.statusCode).toEqual(200);
        
        const stats = redisService.getStats();
        expect(stats.totalCacheHits).toBe(1);
        expect(stats.totalCacheMisses).toBe(1);
    });
  });
});