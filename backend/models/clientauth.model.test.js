// Unit Tests for Client Authentication Model
const clientauthModel = require('./clientauth.model');
const mysql = require('mysql2');

// Use global mocks from tests/setup.js

describe('Client Authentication Model Unit Tests', () => {
  let mockPool;
  let mockPromiseQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mock pool and query function from our global setup
    mockPool = mysql.createPool();
    mockPromiseQuery = mockPool.promise().query;
  });

  describe('create', () => {
    it('should create a client user successfully', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await clientauthModel.create('user@example.com', '1234567890', 'password123');

      // Assert
      const bcrypt = require('bcryptjs');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'INSERT INTO clientusers (email, phone_number, password) VALUES (?, ?, ?)',
        ['user@example.com', '1234567890', 'hashed_password123']
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(clientauthModel.create('user@example.com', '1234567890', 'hashedpassword')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        phone_number: '1234567890',
        password: 'hashedpassword'
      };
      mockPromiseQuery.mockResolvedValue([[mockUser], []]);

      // Act
      const result = await clientauthModel.findByEmail('user@example.com');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT * FROM clientusers WHERE email = ?', ['user@example.com']);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockPromiseQuery.mockResolvedValue([[], []]);

      // Act
      const result = await clientauthModel.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(clientauthModel.findByEmail('user@example.com')).rejects.toThrow('Database query failed');
    });
  });

  describe('getAllUsers', () => {
    it('should get all client users successfully', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, email: 'user1@example.com', phone_number: '1234567890' },
        { id: 2, email: 'user2@example.com', phone_number: '0987654321' }
      ];
      mockPromiseQuery.mockResolvedValue([mockUsers, []]);

      // Act
      const result = await clientauthModel.getAllUsers();

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT id, email, phone_number FROM clientusers', []);
      expect(result).toEqual(mockUsers);
    });

    it('should handle single result object', async () => {
      // Arrange
      const mockUser = { id: 1, email: 'user1@example.com', phone_number: '1234567890' };
      mockPromiseQuery.mockResolvedValue([[mockUser], []]);

      // Act
      const result = await clientauthModel.getAllUsers();

      // Assert
      expect(result).toEqual([mockUser]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(clientauthModel.getAllUsers()).rejects.toThrow('Database query failed');
    });
  });
});
