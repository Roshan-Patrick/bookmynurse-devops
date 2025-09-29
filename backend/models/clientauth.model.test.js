// Unit Tests for Client Authentication Model
const clientauthModel = require('./clientauth.model');

// Mock the database
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const db = require('../config/db');

describe('Client Authentication Model Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a client user successfully', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      db.query.mockResolvedValue(mockResult);

      // Act
      const result = await clientauthModel.create('user@example.com', '1234567890', 'hashedpassword');

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO clientusers (email, phone_number, password) VALUES (?, ?, ?)',
        ['user@example.com', '1234567890', 'hashedpassword']
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      db.query.mockRejectedValue(mockError);

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
      db.query.mockResolvedValue([mockUser]);

      // Act
      const result = await clientauthModel.findByEmail('user@example.com');

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM clientusers WHERE email = ?', ['user@example.com']);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      db.query.mockResolvedValue([]);

      // Act
      const result = await clientauthModel.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      db.query.mockRejectedValue(mockError);

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
      db.query.mockResolvedValue(mockUsers);

      // Act
      const result = await clientauthModel.getAllUsers();

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT id, email, phone_number FROM clientusers');
      expect(result).toEqual(mockUsers);
    });

    it('should handle single result object', async () => {
      // Arrange
      const mockUser = { id: 1, email: 'user1@example.com', phone_number: '1234567890' };
      db.query.mockResolvedValue(mockUser);

      // Act
      const result = await clientauthModel.getAllUsers();

      // Assert
      expect(result).toEqual([mockUser]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      db.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(clientauthModel.getAllUsers()).rejects.toThrow('Database query failed');
    });
  });
});
