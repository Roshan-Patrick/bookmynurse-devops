const request = require('supertest');
const app = require('../app');
const RedisService = require('../services/RedisService');

// Mock the RedisService with a stateful implementation
jest.mock('../services/RedisService');

// Mock the database
jest.mock('../config/db', () => ({
  query: jest.fn()
}));
const db = require('../config/db');

describe('Redis Cache Integration Tests', () => {
  let redisService;
  let internalCache;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock database response for the routes
    db.query.mockResolvedValue([[{ id: 1, name: 'Test Booking' }]]);

    // Create a new stateful mock for each test
    internalCache = new Map();
    const mockRedisService = {
      get: jest.fn(async (key) => {
        if (internalCache.has(key)) {
          mockRedisService.getStats.mock.hits++;
          return JSON.parse(internalCache.get(key));
        }
        mockRedisService.getStats.mock.misses++;
        return null;
      }),
      set: jest.fn(async (key, value) => {
        internalCache.set(key, JSON.stringify(value));
      }),
      clearByPattern: jest.fn(async (pattern) => {
        internalCache.clear(); // Simplified for test
      }),
      getStats: jest.fn(() => ({
        totalCacheHits: mockRedisService.getStats.mock.hits,
        totalCacheMisses: mockRedisService.getStats.mock.misses,
      })),
    };
    mockRedisService.getStats.mock.hits = 0;
    mockRedisService.getStats.mock.misses = 0;

    RedisService.mockImplementation(() => mockRedisService);
    redisService = mockRedisService;
  });

  it('should cache a GET response and register a hit on the second call', async () => {
    // Act: First request
    const res1 = await request(app).get('/api/nursing/getBookings');

    // Assert: First request is a miss, but sets the cache
    expect(res1.statusCode).toBe(200);
    expect(redisService.get).toHaveBeenCalledTimes(1);
    expect(redisService.set).toHaveBeenCalledTimes(1);

    // Act: Second request for the same resource
    const res2 = await request(app).get('/api/nursing/getBookings');

    // Assert: Second request is a hit
    expect(res2.statusCode).toBe(200);
    expect(redisService.get).toHaveBeenCalledTimes(2); // get is called again
    expect(redisService.set).toHaveBeenCalledTimes(1); // set is NOT called again
    const stats = redisService.getStats();
    expect(stats.totalCacheMisses).toBe(1);
    expect(stats.totalCacheHits).toBe(1);
  });
});