const request = require('supertest');
const app = require('../app');
const RedisService = require('../services/RedisService');
const db = require('../config/db');

jest.mock('../services/RedisService');
jest.mock('../config/db');
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: 1 };
    next();
});

describe('Redis Cache Integration Tests', () => {
    let redisService;

    beforeEach(() => {
        jest.clearAllMocks();
        db.query.mockResolvedValue([[{ id: 1, name: 'Test Data' }]]);
        
        const mockRedisService = {
            get: jest.fn(),
            set: jest.fn(),
            clearByPattern: jest.fn(),
        };
        RedisService.mockImplementation(() => mockRedisService);
        redisService = new RedisService();
    });

    it('should cache a GET response and use cache on second call', async () => {
        // Arrange: First call misses the cache
        redisService.get.mockResolvedValueOnce(null);
        
        // Act: First request
        await request(app).get('/api/nursing/getBookings');
        
        // Assert: A miss occurred, so 'get' and 'set' were called
        expect(redisService.get).toHaveBeenCalledTimes(1);
        expect(redisService.set).toHaveBeenCalledTimes(1);
        
        // Arrange: Second call hits the cache
        redisService.get.mockResolvedValueOnce(JSON.stringify([{ id: 1, name: 'Test Data' }]));
        
        // Act: Second request
        await request(app).get('/api/nursing/getBookings');
        
        // Assert: A hit occurred, 'get' was called again, but 'set' was not
        expect(redisService.get).toHaveBeenCalledTimes(2);
        expect(redisService.set).toHaveBeenCalledTimes(1);
    });
});