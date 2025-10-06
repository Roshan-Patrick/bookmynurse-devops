// This will be run before ALL test suites
// It globally mocks the database and redis libraries

// 1. Global mock for mysql2 - Enhanced for better compatibility
jest.mock('mysql2', () => {
    const mockQuery = jest.fn().mockImplementation((sql, values, callback) => {
        if (callback) {
            callback(null, [[]]); // Default success is an empty array
        }
        return mockQuery;
    });
    
    const mockPromiseQuery = jest.fn().mockResolvedValue([[], []]);
    
    const mockPool = {
        query: mockQuery,
        end: jest.fn((callback) => callback && callback()),
        on: jest.fn(),
        promise: jest.fn(() => ({
            query: mockPromiseQuery,
        })),
        _allConnections: [],
        _freeConnections: [],
        _acquiringConnections: [],
        config: { connectionLimit: 20 }
    };
    
    return {
        createPool: jest.fn(() => mockPool),
    };
});

// 2. Global mock for ioredis - Enhanced EventEmitter support
jest.mock('ioredis', () => {
    const { EventEmitter } = require('events');
    
    return class MockIORedis extends EventEmitter {
        constructor(config = {}) {
            super();
            
            // Make all methods jest.fn() so we can track them
            this.connect = jest.fn().mockResolvedValue('OK');
            this.quit = jest.fn().mockResolvedValue('OK');
            this.get = jest.fn().mockResolvedValue(null);
            this.setex = jest.fn().mockResolvedValue('OK');
            this.set = jest.fn().mockResolvedValue('OK');
            this.del = jest.fn().mockResolvedValue(1);
            this.exists = jest.fn().mockResolvedValue(0);
            this.expire = jest.fn().mockResolvedValue(1);
            
            // Auto-connect for testing (removed to prevent async logging after tests)
            // setImmediate(() => {
            //     this.emit('connect');
            // });
        }
    };
});

// 3. Global mock for nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
        verify: jest.fn().mockResolvedValue(true),
    }),
}));

// 4. Global mock for bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password123'),
    compare: jest.fn().mockResolvedValue(true),
}));

// 5. Global mock for dotenv to prevent environment conflicts
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));