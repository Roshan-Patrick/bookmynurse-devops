const request = require('supertest');
const app = require('../app');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

jest.mock('../models/userModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
// Use global mocks from tests/setup.js

describe('Authentication API Integration Tests', () => {
    let mockPromiseQuery;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-jwt-secret';
        
        // Get handle to the mock query function from global setup
        const mockPool = mysql.createPool();
        mockPromiseQuery = mockPool.promise().query;
        
        // Set default mock response
        mockPromiseQuery.mockResolvedValue([{ test: 1 }]);
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = { id: 1, username: 'admin', password: 'hashedpassword', role: 'admin' };
            User.findByUsername.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('a.fake.token');

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.token).toBe('a.fake.token');
        });

        it('should return 401 for invalid password', async () => {
            const mockUser = { id: 1, username: 'admin', password: 'hashedpassword', role: 'admin' };
            User.findByUsername.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false); // Simulate wrong password

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.msg).toBe('Invalid password');
        });
    });
});