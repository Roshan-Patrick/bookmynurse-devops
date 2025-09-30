// Unit Tests for Authentication Controller
const authController = require('../controllers/authController');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock the dependencies
jest.mock('../models/userModel');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

describe('Authentication Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    process.env.JWT_SECRET = 'test-jwt-secret';
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin'
      };

      const mockToken = 'mock-jwt-token';

      User.findByUsername.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue(mockToken);
      
      // Mock the database query that's called in the controller
      const db = require('../config/db');
      db.query.mockResolvedValue([{ test: 1 }]);

      // Act
      await authController.login(req, res);

      // Assert
      expect(User.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, role: 'admin' },
        'test-jwt-secret', // CORRECT: Use the secret from the test environment
        { expiresIn: '1hr' }
      );
      expect(res.json).toHaveBeenCalledWith({
        token: mockToken,
        msg: 'Authorized'
      });
    });

    it('should return 401 for invalid username', async () => {
      // Arrange
      req.body = {
        username: 'nonexistent',
        password: 'password123'
      };

      User.findByUsername.mockResolvedValue(null);

      // Act
      await authController.login(req, res);

      // Assert
      expect(User.findByUsername).toHaveBeenCalledWith('nonexistent');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Invalid Username'
      });
    });

    it('should return 401 for invalid password', async () => {
      // Arrange
      req.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin'
      };

      User.findByUsername.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await authController.login(req, res);

      // Assert
      expect(User.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Invalid password'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      const mockError = new Error('Database connection failed');
      User.findByUsername.mockRejectedValue(mockError);

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Internal server error'
      });
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      req.body = {
        username: 'newuser',
        password: 'password123',
        role: 'user'
      };

      const mockResult = { insertId: 1 };
      User.create.mockResolvedValue(mockResult);

      // Act
      await authController.register(req, res);

      // Assert
      expect(User.create).toHaveBeenCalledWith('newuser', 'password123', 'user');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'User registered successfully'
      });
    });

    it('should handle database errors during registration', async () => {
      // Arrange
      req.body = {
        username: 'newuser',
        password: 'password123',
        role: 'user'
      };

      const mockError = new Error('Database connection failed');
      User.create.mockRejectedValue(mockError);

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Error creating user'
      });
    });
  });

  describe('getUsers', () => {
    it('should get all users successfully', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'user1', role: 'admin' },
        { id: 2, username: 'user2', role: 'user' }
      ];

      User.getAllUsers.mockResolvedValue(mockUsers);

      // Act
      await authController.getUsers(req, res);

      // Assert
      expect(User.getAllUsers).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle database errors when getting users', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      User.getAllUsers.mockRejectedValue(mockError);

      // Act
      await authController.getUsers(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Error fetching users'
      });
    });
  });
});
