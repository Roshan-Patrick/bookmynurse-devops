# Database Configuration and Async/Await Implementation Guide

## Overview
This document outlines the database configuration and async/await implementation for the Nursing Record Management System. The system uses MySQL with the `mysql2` package for better performance and native Promise support.

## Table of Contents
1. [Database Configuration](#database-configuration)
2. [Async/Await Implementation](#asyncawait-implementation)
3. [Connection Pool Management](#connection-pool-management)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)

## Database Configuration

### Using mysql2
We use `mysql2` instead of the older `mysql` package because it provides:
- Native Promise support
- Better performance
- Improved TypeScript support
- Prepared statements
- Modern features

```javascript
const mysql = require('mysql2');
```

### Connection Pool Configuration
The connection pool is configured with optimized settings for production use:

```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'oasys',
    database: process.env.DB_NAME || 'nursing_db',
    waitForConnections: true,
    connectionLimit: 20,        // Maximum number of connections
    queueLimit: 0,             // No limit on queued requests
    enableKeepAlive: true,     // Enable keep-alive
    keepAliveInitialDelay: 10000,  // Send keep-alive after 10s inactivity
    connectTimeout: 10000,     // Connection timeout
    acquireTimeout: 10000,     // Acquire timeout
    idleTimeout: 300000,       // Idle timeout (5 minutes)
    maxIdle: 5,                // Maximum idle connections
    maxRetries: 5,             // Connection retry attempts
    retryDelay: 2000,          // Delay between retries
    connectionTimeout: 60000,   // Connection timeout (1 minute)
    timezone: 'Z',             // UTC timezone
    charset: 'utf8mb4',        // Character set
    debug: process.env.NODE_ENV === 'development'  // Debug mode in development
});
```

## Async/Await Implementation

### Promise Pool Setup
We use a promise wrapper for the pool to enable async/await:

```javascript
const promisePool = pool.promise();
```

### Query Interface
We provide a simplified query interface that uses async/await:

```javascript
module.exports = {
    pool: promisePool,
    query: async (sql, values) => {
        try {
            const [results] = await promisePool.query(sql, values);
            return results;
        } catch (err) {
            console.error('Query error:', err);
            throw err;
        }
    }
};
```

### Usage Examples

#### Basic Query
```javascript
// Using the query helper
const results = await query('SELECT * FROM table');

// Using the pool directly
const [rows, fields] = await pool.query('SELECT * FROM table');
```

#### Model Layer Example
```javascript
// Example from nursingRegistration.model.js
updateNurse: async (id, updatedData) => {
    try {
        const {
            name, aadhaar, mobile, email, gender, dob, education, experience,
            languages, specialization, address, base_location, serviceopt
        } = updatedData;

        const sql = `
            UPDATE registration 
            SET name = ?, aadhaar = ?, mobile = ?, email = ?, gender = ?, 
                dob = ?, education = ?, experience = ?, languages = ?, 
                specialization = ?, address = ?, base_location = ?, serviceopt = ?
            WHERE id = ?`;

        const values = [
            name, aadhaar, mobile, email, gender, dob, education, experience,
            languages, specialization, address, base_location, serviceopt, id
        ];

        const [result] = await query(sql, values);
        return result;
    } catch (err) {
        console.error("Error updating registration:", err);
        throw err;
    }
}
```

## Connection Pool Management

### Periodic Connection Check
We implement a periodic connection check to ensure database connectivity:

```javascript
setInterval(async () => {
    try {
        const connection = await promisePool.getConnection();
        await connection.ping();
        connection.release();
        console.log('Database connection is alive');
    } catch (err) {
        console.error('Periodic connection check failed:', err);
    }
}, 300000); // Check every 5 minutes
```

### Initial Connection Test
```javascript
(async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('Successfully connected to database.');
        connection.release();
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
})();
```

## Error Handling

### Pool Error Handling
We implement comprehensive error handling for the connection pool:

```javascript
pool.on('error', (err) => {
    console.error('Database pool error:', {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        // Handle lost connection
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
        // Handle too many connections
    } else if (err.code === 'ECONNREFUSED') {
        // Handle connection refused
    } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        // Handle fatal error
    }
});
```

## Best Practices

1. **Always Use Async/Await**
   - Use async/await instead of callbacks for better readability and error handling
   - Wrap database operations in try/catch blocks

2. **Connection Management**
   - Use connection pooling instead of single connections
   - Always release connections after use
   - Implement proper error handling for connection issues

3. **Query Security**
   - Use parameterized queries to prevent SQL injection
   - Never concatenate user input directly into SQL queries

4. **Error Handling**
   - Implement comprehensive error handling
   - Log errors with detailed information
   - Use appropriate error status codes in responses

5. **Performance**
   - Use appropriate connection pool settings
   - Implement connection timeouts
   - Use keep-alive to maintain connections
   - Monitor connection pool status

6. **Environment Configuration**
   - Use environment variables for sensitive information
   - Provide fallback values for development
   - Enable debug mode only in development

## Troubleshooting

Common issues and solutions:

1. **Connection Lost**
   - Check if the database server is running
   - Verify network connectivity
   - Check connection pool settings

2. **Too Many Connections**
   - Review connection pool limits
   - Check for connection leaks
   - Monitor connection usage

3. **Query Timeouts**
   - Review query performance
   - Check connection timeout settings
   - Optimize slow queries

4. **Connection Refused**
   - Verify database credentials
   - Check database server status
   - Verify network firewall settings 