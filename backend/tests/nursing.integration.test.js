const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

jest.mock('../config/db');
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: 1, role: 'admin' }; // Mock a logged-in admin user
    next();
});

describe('Nursing API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new booking successfully', async () => {
        db.query.mockResolvedValue([{ insertId: 1 }]);
        const bookingData = { 
            name: 'Test', 
            mobile: '1234567890', 
            nurseType: 'RN', 
            location: 'City', 
            services: 'Care', 
            preferences: 'Day', 
            enquiryno: 'ENQ1' 
        };
        const response = await request(app).post('/api/nursing/bookings').send(bookingData);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Booking created successfully!');
    });

    it('should return 400 for invalid booking data', async () => {
        // No need to mock db.query, as the validation middleware should catch this
        const invalidData = { name: 'Test' }; // Missing fields
        const response = await request(app).post('/api/nursing/bookings').send(invalidData);
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });
});