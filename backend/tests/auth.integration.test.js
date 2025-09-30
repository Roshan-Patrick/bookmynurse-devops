const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Mock all necessary dependencies at the top level
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../models/userModel');

// Mock the auth middleware for routes that might be protected
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
});

describe('Authentication API Integration Tests', () => {
    beforeEach(() => {
        // Clear all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Set a predictable JWT secret for the test environment
        process.env.JWT_SECRET = 'test-jwt-secret';
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            // Arrange: Simulate a perfect login flow
            const mockUser = { id: 1, username: 'admin', password: 'hashedpassword', role: 'admin' };
            User.findByUsername.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true); // IMPORTANT: Simulate a correct password match
            jwt.sign.mockReturnValue('valid.jwt.token');

            const loginData = { username: 'admin', password: 'password123' };

            // Act
            const response = await request(app).post('/api/auth/login').send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.msg).toBe('Authorized');
        });

        it('should return 401 for invalid password', async () => {
            // Arrange: Simulate a user being found, but the password being wrong
            const mockUser = { id: 1, username: 'admin', password: 'hashedpassword', role: 'admin' };
            User.findByUsername.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false); // IMPORTANT: Simulate a wrong password

            const loginData = { username: 'admin', password: 'wrongpassword' };

            // Act
            const response = await request(app).post('/api/auth/login').send(loginData);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.msg).toBe('Invalid password');
        });

        it('should return 401 for invalid username', async () => {
            // Arrange: Simulate user not found
            User.findByUsername.mockResolvedValue(null);

            const loginData = { username: 'nouser', password: 'password123' };

            // Act
            const response = await request(app).post('/api/auth/login').send(loginData);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.msg).toBe('Invalid Username');
        });
    });
});