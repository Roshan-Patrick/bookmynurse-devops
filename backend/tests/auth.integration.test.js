const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../models/userModel');

describe('Authentication API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-jwt-secret';

        // Default mock for a successful login flow
        const mockUser = { id: 1, username: 'admin', password: 'hashedpassword', role: 'admin' };
        User.findByUsername.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true); // Simulate correct password
        jwt.sign.mockReturnValue('valid.jwt.token');
        User.getAllUsers.mockResolvedValue([{ id: 1, username: 'admin' }]);
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            // Arrange
            const loginData = { username: 'admin', password: 'password123' };

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.msg).toBe('Authorized');
        });

        it('should return 401 for invalid username', async () => {
            // Arrange: Override the default mock to simulate user not found
            User.findByUsername.mockResolvedValue(null);
            const loginData = { username: 'wronguser', password: 'password123' };

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.msg).toBe('Invalid Username');
        });

        it('should return 401 for invalid password', async () => {
            // Arrange: Override the default mock to simulate wrong password
            bcrypt.compare.mockResolvedValue(false);
            const loginData = { username: 'admin', password: 'wrongpassword' };

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.msg).toBe('Invalid password');
        });
    });

    describe('GET /api/auth/users', () => {
        it('should get all users with a valid token', async () => {
            // Arrange
            jwt.verify.mockReturnValue({ id: 1, role: 'admin' });

            // Act
            const response = await request(app)
                .get('/api/auth/users')
                .set('Authorization', 'Bearer valid.jwt.token');

            // Assert
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});