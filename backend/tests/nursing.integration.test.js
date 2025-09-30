const request = require('supertest');
const express = require('express');
const nursingRoutes = require('../routes/nursing.routes');
const { validateBooking } = require('../middleware/validation');

// Mock dependencies
jest.mock('../config/db');
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
});

const app = express();
app.use(express.json());
// Apply the REAL validation middleware to the test app
app.use('/api/nursing', nursingRoutes);

describe('Nursing API Integration Tests', () => {
    const db = require('../config/db');

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
    });

    it('should return 400 for invalid booking data', async () => {
        const invalidData = { name: 'Test' }; // Missing required fields
        const response = await request(app).post('/api/nursing/bookings').send(invalidData);
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].msg).toContain('mobile is required');
    });
});