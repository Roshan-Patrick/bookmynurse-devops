// This variable will hold our single, shared mock function.
let mockPromiseQuery;

// 1. At the very top, completely un-do the global mock from setup.js for this file.
jest.unmock('mysql2');

// 2. Provide a NEW, non-hoisted mock just for this file.
//    This factory will be used instead of the one in setup.js.
jest.doMock('mysql2', () => {
    // Create the mock function here and assign it to our shared variable.
    mockPromiseQuery = jest.fn();
    return {
        createPool: jest.fn(() => ({
            promise: jest.fn(() => ({
                // Ensure the query property always uses our shared mock function.
                query: mockPromiseQuery,
            })),
            // Add other properties db.js needs to avoid errors
            on: jest.fn(),
            end: jest.fn((callback) => callback && callback()),
        })),
    };
});

// This require must come AFTER the mocks are configured.
const mysql = require('mysql2');

describe('Database Configuration', () => {
    let db;

    beforeEach(() => {
        // 3. Reset modules to get a fresh db.js that will use our clean, shared mock.
        jest.resetModules();
        db = require('./db');
        // 4. Clear the mock's call history before each test, but not its implementation.
        mockPromiseQuery.mockClear();
    });

    it('should create a pool and execute a query', async () => {
        // 5. Configure the shared mock's behavior for THIS specific test.
        mockPromiseQuery.mockResolvedValue([['query result'], []]);
        const result = await db.query('SELECT 1');
        expect(result).toEqual(['query result']);
    });

    it('should handle query with parameters', async () => {
        mockPromiseQuery.mockResolvedValue([[{ id: 1 }], []]);
        const result = await db.query('SELECT * FROM users WHERE id = ?', [1]);
        expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
        expect(result).toEqual([{ id: 1 }]);
    });

    it('should handle database errors', async () => {
        const mockError = new Error('Database connection failed');
        mockPromiseQuery.mockRejectedValue(mockError);
        await expect(db.query('SELECT 1')).rejects.toThrow('Database connection failed');
    });
});