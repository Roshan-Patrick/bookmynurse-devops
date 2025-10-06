const clientauthController = require('./clientauthController');
const User = require('../models/clientauth.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Use global mocks from tests/setup.js
jest.mock('../models/clientauth.model');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('ClientAuthController', () => {
    let req, res, mockUser;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock request object
        req = {
            body: {}
        };

        // Mock response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Mock user data
        mockUser = {
            id: 1,
            email: 'test@example.com',
            phone_number: '1234567890',
            password: 'hashedpassword'
        };
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            // Arrange
            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };
            
            User.findByEmail.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-jwt-token');

            // Act
            await clientauthController.login(req, res);

            // Assert
            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 1, email: 'test@example.com' },
                process.env.JWT_SECRET || 'your_jwt_secret',
                { expiresIn: '1h' }
            );
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-jwt-token',
                message: 'Login successful'
            });
        });

        it('should return invalid email for non-existent user', async () => {
            // Arrange
            req.body = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };
            
            User.findByEmail.mockResolvedValue(null);

            // Act
            await clientauthController.login(req, res);

            // Assert
            expect(User.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email' });
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should return invalid password for wrong password', async () => {
            // Arrange
            req.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };
            
            User.findByEmail.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            // Act
            await clientauthController.login(req, res);

            // Assert
            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid password' });
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            // Arrange
            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };
            
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            User.findByEmail.mockRejectedValue(new Error('Database connection failed'));

            // Act
            await clientauthController.login(req, res);

            // Assert
            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe('register', () => {
        it('should register user successfully', async () => {
            // Arrange
            req.body = {
                email: 'newuser@example.com',
                phone_number: '9876543210',
                password: 'password123'
            };
            
            User.findByEmail.mockResolvedValue(null);
            User.create.mockResolvedValue();

            // Act
            await clientauthController.register(req, res);

            // Assert
            expect(User.findByEmail).toHaveBeenCalledWith('newuser@example.com');
            expect(User.create).toHaveBeenCalledWith('newuser@example.com', '9876543210', 'password123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
        });

        it('should return error for existing email', async () => {
            // Arrange
            req.body = {
                email: 'existing@example.com',
                phone_number: '9876543210',
                password: 'password123'
            };
            
            User.findByEmail.mockResolvedValue(mockUser);

            // Act
            await clientauthController.register(req, res);

            // Assert
            expect(User.findByEmail).toHaveBeenCalledWith('existing@example.com');
            expect(User.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
        });

        it('should handle database errors during registration', async () => {
            // Arrange
            req.body = {
                email: 'newuser@example.com',
                phone_number: '9876543210',
                password: 'password123'
            };
            
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            User.findByEmail.mockRejectedValue(new Error('Database connection failed'));

            // Act
            await clientauthController.register(req, res);

            // Assert
            expect(User.findByEmail).toHaveBeenCalledWith('newuser@example.com');
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error creating user' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Registration error:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe('getUsers', () => {
        it('should fetch all users successfully', async () => {
            // Arrange
            const mockUsers = [mockUser, { id: 2, email: 'user2@example.com' }];
            User.getAllUsers.mockResolvedValue(mockUsers);

            // Act
            await clientauthController.getUsers(req, res);

            // Assert
            expect(User.getAllUsers).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockUsers);
        });

        it('should handle database errors when fetching users', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            User.getAllUsers.mockRejectedValue(new Error('Database query failed'));

            // Act
            await clientauthController.getUsers(req, res);

            // Assert
            expect(User.getAllUsers).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching users' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching users:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });
});
