// Unit Tests for User Model
const userModel = require('./userModel');
const mysql = require('mysql2');

// Use global mocks from tests/setup.js
const bcrypt = require('bcryptjs');

describe('User Model Unit Tests', () => {
  let mockPromiseQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get handle to the mock query function from global setup
    const mockPool = mysql.createPool();
    mockPromiseQuery = mockPool.promise().query;
  });

  describe('create', () => {
    it('should create a user with role successfully', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await userModel.create('newuser', 'password123', 'admin');

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['newuser', 'hashed_password123', 'admin']
      );
      expect(result).toEqual(mockResult);
    });

    it('should create a user without role successfully', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await userModel.create('newuser', 'password123');

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        ['newuser', 'hashed_password123']
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      mockPromiseQuery.mockRejectedValue(mockError);

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
      mockPromiseQuery.mockResolvedValue([[mockUser], []]);

      // Act
      const result = await userModel.findByUsername('testuser');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?', ['testuser']);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockPromiseQuery.mockResolvedValue([[], []]);

      // Act
      const result = await userModel.findByUsername('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      mockPromiseQuery.mockRejectedValue(mockError);

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
      mockPromiseQuery.mockResolvedValue([mockUsers, []]);

      // Act
      const result = await userModel.getAllUsers();

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT * FROM users', []);
      expect(result).toEqual(mockUsers);
    });

    it('should handle single result object', async () => {
      // Arrange
      const mockUser = { id: 1, username: 'user1', role: 'admin' };
      mockPromiseQuery.mockResolvedValue([[mockUser], []]);

      // Act
      const result = await userModel.getAllUsers();

      // Assert
      expect(result).toEqual([mockUser]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(userModel.getAllUsers()).rejects.toThrow('Database query failed');
    });
  });
});
