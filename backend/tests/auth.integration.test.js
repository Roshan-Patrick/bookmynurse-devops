const request = require('supertest');
const app = require('../app');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../models/userModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Authentication API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-jwt-secret';
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