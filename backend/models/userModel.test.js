// Unit Tests for User Model
const userModel = require('./userModel');

// Mock the database
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password, salt) => Promise.resolve(`hashed_${password}`))
}));

const db = require('../config/db');
const bcrypt = require('bcryptjs');

describe('User Model Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user with role successfully', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      db.query.mockResolvedValue(mockResult);

      // Act
      const result = await userModel.create('newuser', 'password123', 'admin');

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['newuser', 'hashed_password123', 'admin']
      );
      expect(result).toEqual(mockResult);
    });

    it('should create a user without role successfully', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      db.query.mockResolvedValue(mockResult);

      // Act
      const result = await userModel.create('newuser', 'password123');

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        ['newuser', 'hashed_password123']
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      db.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(userModel.create('newuser', 'hashedpassword', 'admin')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUsername', () => {
    it('should find user by username successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin'
      };
      db.query.mockResolvedValue([mockUser]);

      // Act
      const result = await userModel.findByUsername('testuser');

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?', ['testuser']);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      db.query.mockResolvedValue([]);

      // Act
      const result = await userModel.findByUsername('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      db.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(userModel.findByUsername('testuser')).rejects.toThrow('Database query failed');
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'user1', role: 'admin' },
        { id: 2, username: 'user2', role: 'user' }
      ];
      db.query.mockResolvedValue(mockUsers);

      // Act
      const result = await userModel.getAllUsers();

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users');
      expect(result).toEqual(mockUsers);
    });

    it('should handle single result object', async () => {
      // Arrange
      const mockUser = { id: 1, username: 'user1', role: 'admin' };
      db.query.mockResolvedValue(mockUser);

      // Act
      const result = await userModel.getAllUsers();

      // Assert
      expect(result).toEqual([mockUser]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      db.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(userModel.getAllUsers()).rejects.toThrow('Database query failed');
    });
  });
});
