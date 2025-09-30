const mysql = require('mysql2');

// Mock the mysql2 module at the top level
jest.mock('mysql2', () => {
    const mockPool = {
        query: jest.fn(),
        end: jest.fn((callback) => callback()),
        on: jest.fn(),
        promise: () => ({
            query: jest.fn().mockResolvedValue([[]]), // Default to resolving empty
            getConnection: jest.fn(),
        }),
    };
    return {
        createPool: jest.fn(() => mockPool),
    };
});

describe('Database Configuration Unit Tests', () => {
    let db;
    let mockPool;

    beforeEach(() => {
        jest.resetModules(); // CRITICAL: Clears the cache for db.js
        const mysql = require('mysql2');
        mockPool = mysql.createPool(); // Gets the mocked pool
        db = require('./db'); // require() db module AFTER mock is set up
    });

    it('should create connection pool with correct configuration', () => {
        expect(mysql.createPool).toHaveBeenCalledWith(expect.objectContaining({
            host: 'localhost',
            user: 'bnmuser',
        }));
    });

    it('should execute queries successfully', async () => {
        const promiseQuery = mockPool.promise().query;
        promiseQuery.mockResolvedValue([['result']]);
        const result = await db.query('SELECT * FROM test');
        expect(promiseQuery).toHaveBeenCalledWith('SELECT * FROM test', undefined);
        expect(result).toEqual(['result']);
    });
});