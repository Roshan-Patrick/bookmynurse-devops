// Unit Tests for Database Configuration
const db = require('./db');

// Mock mysql2
jest.mock('mysql2', () => ({
  createPool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    promise: jest.fn(() => ({
      query: jest.fn(),
      getConnection: jest.fn()
    }))
  }))
}));

const mysql = require('mysql2');

describe('Database Configuration Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database Connection Pool', () => {
    it('should create connection pool with correct configuration', () => {
      // Arrange
      const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      const result = require('./db');

      // Assert
      expect(mysql.createPool).toHaveBeenCalledWith({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nursing_db',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      });
    });

    it('should handle connection pool errors', () => {
      // Arrange
      const mockError = new Error('Connection failed');
      mysql.createPool.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      expect(() => require('./db')).toThrow('Connection failed');
    });
  });

  describe('Database Query Function', () => {
    it('should execute queries successfully', async () => {
      // Arrange
      const mockPool = {
        query: jest.fn().mockImplementation((sql, params, callback) => {
          if (callback) {
            callback(null, [{ id: 1, name: 'Test' }]);
          } else {
            return Promise.resolve([{ id: 1, name: 'Test' }]);
          }
        }),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      const result = await db.query('SELECT * FROM test');

      // Assert
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test', [], expect.any(Function));
    });

    it('should handle query errors', async () => {
      // Arrange
      const mockError = new Error('Query failed');
      const mockPool = {
        query: jest.fn().mockImplementation((sql, params, callback) => {
          if (callback) {
            callback(mockError, null);
          } else {
            return Promise.reject(mockError);
          }
        }),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act & Assert
      await expect(db.query('SELECT * FROM test')).rejects.toThrow('Query failed');
    });

    it('should handle queries with parameters', async () => {
      // Arrange
      const mockPool = {
        query: jest.fn().mockImplementation((sql, params, callback) => {
          if (callback) {
            callback(null, [{ id: 1, name: 'Test' }]);
          } else {
            return Promise.resolve([{ id: 1, name: 'Test' }]);
          }
        }),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      const result = await db.query('SELECT * FROM test WHERE id = ?', [1]);

      // Assert
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [1], expect.any(Function));
    });
  });

  describe('Database Connection Events', () => {
    it('should handle connection events', () => {
      // Arrange
      const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      require('./db');

      // Assert
      expect(mockPool.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle connection success event', () => {
      // Arrange
      const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      require('./db');

      // Get the connection event handler
      const connectionHandler = mockPool.on.mock.calls.find(call => call[0] === 'connection')[1];

      // Assert
      expect(connectionHandler).toBeDefined();
      expect(typeof connectionHandler).toBe('function');
    });

    it('should handle connection error event', () => {
      // Arrange
      const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      require('./db');

      // Get the error event handler
      const errorHandler = mockPool.on.mock.calls.find(call => call[0] === 'error')[1];

      // Assert
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler).toBe('function');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use environment variables for database configuration', () => {
      // Arrange
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DB_HOST: 'test-host',
        DB_USER: 'test-user',
        DB_PASSWORD: 'test-password',
        DB_NAME: 'test-database',
        DB_PORT: '3307'
      };

      const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      require('./db');

      // Assert
      expect(mysql.createPool).toHaveBeenCalledWith({
        host: 'test-host',
        user: 'test-user',
        password: 'test-password',
        database: 'test-database',
        port: '3307',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      });

      // Restore original environment
      process.env = originalEnv;
    });

    it('should use default values when environment variables are not set', () => {
      // Arrange
      const originalEnv = process.env;
      process.env = {};

      const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      require('./db');

      // Assert
      expect(mysql.createPool).toHaveBeenCalledWith({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nursing_db',
        port: 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      });

      // Restore original environment
      process.env = originalEnv;
    });
  });

  describe('Database Pool Configuration', () => {
    it('should configure connection pool with correct limits', () => {
      // Arrange
      const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      require('./db');

      // Assert
      expect(mysql.createPool).toHaveBeenCalledWith(
        expect.objectContaining({
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          acquireTimeout: 60000,
          timeout: 60000,
          reconnect: true
        })
      );
    });

    it('should handle pool exhaustion gracefully', async () => {
      // Arrange
      const mockPool = {
        query: jest.fn().mockImplementation((sql, params, callback) => {
          if (callback) {
            callback(new Error('Pool exhausted'), null);
          } else {
            return Promise.reject(new Error('Pool exhausted'));
          }
        }),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act & Assert
      await expect(db.query('SELECT * FROM test')).rejects.toThrow('Pool exhausted');
    });
  });

  describe('Database Connection Cleanup', () => {
    it('should provide pool end method for cleanup', () => {
      // Arrange
      const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      const result = require('./db');

      // Assert
      expect(result.pool).toBeDefined();
      expect(result.pool.end).toBeDefined();
      expect(typeof result.pool.end).toBe('function');
    });

    it('should handle pool cleanup errors', async () => {
      // Arrange
      const mockPool = {
        query: jest.fn(),
        end: jest.fn().mockImplementation((callback) => {
          if (callback) {
            callback(new Error('Cleanup failed'));
          } else {
            return Promise.reject(new Error('Cleanup failed'));
          }
        }),
        on: jest.fn()
      };
      mysql.createPool.mockReturnValue(mockPool);

      // Act
      const result = require('./db');

      // Assert
      await expect(result.pool.end()).rejects.toThrow('Cleanup failed');
    });
  });
});
