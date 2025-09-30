// Integration Tests for Authentication API Endpoints
const request = require('supertest');
const app = require('../app');

// Mock database
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const db = require('../config/db');

describe('Authentication API Integration Tests', () => {
  beforeEach(() => {
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    // Mock database responses
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT * FROM users WHERE username')) {
        return Promise.resolve([{ id: 1, username: 'admin', password: 'hashedpassword', role: 'admin' }]);
      }
      if (sql.includes('INSERT INTO users')) {
        return Promise.resolve({ insertId: 1 });
      }
      if (sql.includes('SELECT * FROM users')) {
        return Promise.resolve([{ id: 1, username: 'admin', role: 'admin' }]);
      }
      return Promise.resolve([]);
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        username: 'admin',
        password: 'admin123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.msg).toBe('Authorized');
    });

    it('should return 401 for invalid username', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'admin123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.msg).toBe('Invalid Username');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        username: 'admin',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.msg).toBe('Invalid password');
    });

    it('should return 500 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.msg).toBe('User registered successfully');
    });

    it('should return 500 for missing required fields', async () => {
      const userData = {
        username: 'newuser'
        // Missing password and role
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/auth/users', () => {
    let authToken;

    beforeAll(async () => {
      // Get authentication token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      
      authToken = loginResponse.body.token;
    });

    it('should get all users with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should return 400 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token.');
    });
  });
});
