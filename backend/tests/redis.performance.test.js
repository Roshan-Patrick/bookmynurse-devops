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
  let internalCache;

  beforeAll(() => {
    // Mock database responses
    db.query.mockImplementation((sql, params) => {
        return Promise.resolve([[{ id: 1, name: 'John Doe' }]]);
    });

    // Create a stateful mock for RedisService
    internalCache = new Map();
    const mockRedisService = {
        get: jest.fn(async (key) => {
            if (internalCache.has(key)) {
                return internalCache.get(key);
            }
            return null;
        }),
        set: jest.fn(async (key, value) => {
            internalCache.set(key, value);
        }),
        clearAllCache: jest.fn(async () => {
            internalCache.clear();
        }),
        disconnect: jest.fn().mockResolvedValue(true)
    };

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

  describe('Cache Performance Benchmarks', () => {
    it('should measure cache hit vs miss performance', async () => {
        const iterations = 5;
        let totalMissTime = 0;
        let totalHitTime = 0;

        // Measure cache miss performance
        for (let i = 0; i < iterations; i++) {
            await redisService.clearAllCache(); // Force cache miss
            const start = Date.now();
            await request(app).get('/api/nursing/getBookings');
            totalMissTime += Date.now() - start;
        }

        // Warm up the cache for hit test
        await request(app).get('/api/nursing/getBookings');

        // Measure cache hit performance
        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            await request(app).get('/api/nursing/getBookings');
            totalHitTime += Date.now() - start;
        }

        const avgMissTime = totalMissTime / iterations;
        const avgHitTime = totalHitTime / iterations;

        console.log(`Average Cache Miss Time: ${avgMissTime.toFixed(2)}ms`);
        console.log(`Average Cache Hit Time: ${avgHitTime.toFixed(2)}ms`);

        expect(avgHitTime).toBeLessThan(avgMissTime);
    });
  });
});