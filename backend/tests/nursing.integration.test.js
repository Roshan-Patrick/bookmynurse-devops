const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const { validateBooking } = require('../middleware/validation');

jest.mock('../config/db');
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
});

describe('Nursing API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new booking successfully', async () => {
        db.query.mockResolvedValue({ insertId: 1 });
        const bookingData = { 
            name: 'Test', 
            mobile: '1234567890', 
            nurseType: 'Registered Nurse', 
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
        const invalidData = { name: 'Test' }; // Missing required fields
        const response = await request(app).post('/api/nursing/bookings').send(invalidData);
        // Assert that the validation middleware catches the error
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].msg).toContain('mobile is required');
    });
});