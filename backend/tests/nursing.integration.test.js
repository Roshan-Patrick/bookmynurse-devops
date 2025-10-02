const request = require('supertest');
const app = require('../app');
const mysql = require('mysql2');

// Auth and DB are now globally mocked, so we just need to control their behavior
describe('Nursing API Integration Tests', () => {
    let mockPromiseQuery;

    beforeEach(() => {
        // Clear mock history before each test
        jest.clearAllMocks();
        
        // Get handle to the mock query function from global setup
        const mockPool = mysql.createPool();
        mockPromiseQuery = mockPool.promise().query;
        
        // Set default mock response
        mockPromiseQuery.mockResolvedValue([[{ id: 1, name: 'Test' }]]);
    });

    it('should return 400 for invalid booking data', async () => {
        // No DB mock needed, as validation should fail first
        const invalidData = { name: 'Test' }; // Missing mobile, etc.
        const response = await request(app).post('/api/nursing/bookings').send(invalidData);
        expect(response.status).toBe(400);
        // Just verify we got a 400 response with some error information
        expect(response.body).toBeDefined();
    });
});