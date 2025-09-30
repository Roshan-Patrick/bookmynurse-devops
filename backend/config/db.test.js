const mysql = require('mysql2');

// Mock the mysql2 module ENTIRELY before any imports
jest.mock('mysql2', () => ({
  createPool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn((callback) => callback()),
    on: jest.fn(),
    promise: () => ({
        query: jest.fn(),
        getConnection: jest.fn(),
    }),
  })),
}));

describe('Database Configuration Unit Tests', () => {
  let db;
  let mockPool;

  beforeEach(() => {
    // Reset modules to ensure db.js is re-evaluated with a fresh mock
    jest.resetModules();
    // Re-import mysql2 to get the fresh mock
    const mysql = require('mysql2');

    // Create a fresh mock pool for each test
    mockPool = {
      query: jest.fn((sql, values, callback) => callback(null, [{ id: 1 }])),
      end: jest.fn((callback) => callback()),
      on: jest.fn(),
      promise: () => ({ query: jest.fn(), getConnection: jest.fn() }),
    };

    // Set the default mock implementation for createPool
    mysql.createPool.mockReturnValue(mockPool);

    // IMPORTANT: Require the module under test AFTER the mock is set up
    db = require('./db');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create connection pool with correct configuration', () => {
    // The require() in beforeEach already triggered this
    expect(mysql.createPool).toHaveBeenCalledWith(expect.objectContaining({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'bnmuser',
    }));
  });

  it('should execute queries successfully using callbacks', async () => {
    const mockResults = [{ id: 1, name: 'Test' }];
    mockPool.query.mockImplementation((sql, values, callback) => {
      callback(null, mockResults);
    });

    const result = await db.query('SELECT * FROM test');
    expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test', [], expect.any(Function));
    expect(result).toEqual(mockResults);
  });

  it('should handle query errors with callbacks', async () => {
      const mockError = new Error('Query failed');
      mockPool.query.mockImplementation((sql, values, callback) => {
        callback(mockError, null);
      });

      await expect(db.query('SELECT * FROM test')).rejects.toThrow('Query failed');
    });
});
