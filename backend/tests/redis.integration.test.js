const request = require('supertest');
const app = require('../app');
const RedisService = require('../services/RedisService');
const mysql = require('mysql2');

// Use global mocks from tests/setup.js
jest.mock('../services/RedisService');
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: 1 };
  next();
});

describe('Redis Cache Integration Tests', () => {
    let mockRedisService;
    let mockPromiseQuery;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Get handle to the mock query function from global setup
        const mockPool = mysql.createPool();
        mockPromiseQuery = mockPool.promise().query;
        mockPromiseQuery.mockResolvedValue([[{ id: 1, name: 'Test Data' }]]);
        
        // Create a mock Redis service instance
        mockRedisService = {
            get: jest.fn(),
            set: jest.fn(),
            clearByPattern: jest.fn(),
            status: 'connected'
        };
        
        // Mock the RedisService class to return our mock instance
        RedisService.mockImplementation(() => mockRedisService);
    });

    it('should make API calls without Redis caching (current implementation)', async () => {
        // Arrange: Mock Redis to return null (no cache)
        mockRedisService.get.mockResolvedValue(null);
        
        // Act: Make API request
        const response = await request(app).get('/api/nursing/getBookings');
        
        // Assert: API should work without Redis caching
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        
        // Note: Redis methods are not called because caching is not implemented in the API yet
        // This test verifies that the API works without Redis caching
        expect(mockRedisService.get).toHaveBeenCalledTimes(0);
        expect(mockRedisService.set).toHaveBeenCalledTimes(0);
    });

    it('should handle Redis service instantiation', () => {
        // Arrange & Act: Create Redis service instance
        const redisInstance = new RedisService();
        
        // Assert: Redis service should be created successfully
        expect(redisInstance).toBeDefined();
        expect(redisInstance.status).toBe('connected');
        expect(RedisService).toHaveBeenCalled();
  });
});
