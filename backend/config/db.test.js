const mysql = require('mysql2');

// Define the mock at the top level
jest.mock('mysql2');

describe('Database Configuration Unit Tests', () => {
    let db;
    let mockPool;

    beforeEach(() => {
        // Reset modules to clear cache
        jest.resetModules();
        // Re-import mysql2 to get the fresh mock for this test
        const mysql = require('mysql2');
        // Define a fresh mock pool for every test
        mockPool = {
            query: jest.fn(),
            on: jest.fn(),
            promise: () => ({
                query: jest.fn().mockResolvedValue([[]]), // Default to resolving empty
            }),
        };
        // Configure the createPool mock to return our fresh pool
        mysql.createPool.mockReturnValue(mockPool);
        // Now, require the module under test. It will use the mock we just set up.
        db = require('./db');
    });

    it('should create connection pool with correct configuration', () => {
        expect(mysql.createPool).toHaveBeenCalledWith(expect.objectContaining({
            host: 'localhost',
            user: 'bnmuser'
        }));
    });

    it('should execute queries successfully', async () => {
        const promiseQuery = mockPool.promise().query;
        promiseQuery.mockResolvedValue([['result']]); // Set specific return value for this test
        const result = await db.query('SELECT * FROM test');
        expect(promiseQuery).toHaveBeenCalledWith('SELECT * FROM test', undefined);
        expect(result).toEqual(['result']);
    });
});