const mysql = require('mysql2');

// Mock the mysql2 module at the top level
jest.mock('mysql2');

describe('Database Configuration Unit Tests', () => {
  let db;
  let mockPool;

  beforeEach(() => {
    // Reset modules to ensure db.js is re-evaluated with a fresh mock for each test
    jest.resetModules();

    // Create a fresh, default mock pool for each test
    mockPool = {
      query: jest.fn((sql, values, callback) => callback(null, [{ id: 1 }])),
      end: jest.fn((callback) => callback()),
      on: jest.fn(),
    };

    // Set the default mock implementation for createPool
    mysql.createPool.mockReturnValue(mockPool);
  });

  describe('Database Connection Pool', () => {
    it('should create connection pool with correct configuration', () => {
      // Act: require the db module inside the test to trigger initialization
      db = require('./db');

      // Assert
      expect(mysql.createPool).toHaveBeenCalledWith(expect.objectContaining({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'bnmuser',
        password: process.env.DB_PASSWORD || 'bnmpassword',
        database: process.env.DB_NAME || 'bookmynurse',
      }));
    });
  });

  describe('Database Query Function', () => {
    it('should execute queries successfully using callbacks', async () => {
      // Arrange
      const mockResults = [{ id: 1, name: 'Test' }];
      mockPool.query.mockImplementation((sql, values, callback) => {
        callback(null, mockResults);
      });
      db = require('./db');

      // Act
      const result = await db.query('SELECT * FROM test');

      // Assert
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test', [], expect.any(Function));
      expect(result).toEqual(mockResults);
    });

    it('should handle query errors with callbacks', async () => {
        // Arrange
        const mockError = new Error('Query failed');
        mockPool.query.mockImplementation((sql, values, callback) => {
          callback(mockError, null);
        });
        db = require('./db');
  
        // Act & Assert
        await expect(db.query('SELECT * FROM test')).rejects.toThrow('Query failed');
      });
  });

  describe('Database Connection Events', () => {
    it('should register connection and error event handlers', () => {
      // Act
      db = require('./db');

      // Assert
      expect(mockPool.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });
});