// Unit Tests for Authentication Middleware
const auth = require('./auth');
const jwt = require('jsonwebtoken');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Authentication Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_jwt_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('Valid Token Scenarios', () => {
    it('should authenticate user with valid token', () => {
      // Arrange
      const mockUser = { id: 1, role: 'admin' };
      const token = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(mockUser);

      // Act
      auth(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test_jwt_secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', () => {
      // Arrange
      const mockUser = { id: 1, role: 'user' };
      const token = 'valid.jwt.token';
      req.headers.authorization = token;
      jwt.verify.mockReturnValue(mockUser);

      // Act
      auth(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test_jwt_secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should handle token with different case Bearer prefix', () => {
      // Arrange
      const mockUser = { id: 1, role: 'user' };
      const token = 'valid.jwt.token';
      req.headers.authorization = `bearer ${token}`;
      jwt.verify.mockReturnValue(mockUser);

      // Act
      auth(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test_jwt_secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Invalid Token Scenarios', () => {
    it('should reject request without authorization header', () => {
      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'No token, authorization denied' });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    it('should reject request with empty authorization header', () => {
      // Arrange
      req.headers.authorization = '';

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'No token, authorization denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      // Arrange
      req.headers.authorization = 'Bearer';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', () => {
      // Arrange
      const token = 'expired.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed token', () => {
      // Arrange
      const token = 'malformed.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Malformed token');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid signature', () => {
      // Arrange
      const token = 'invalid.signature.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing JWT_SECRET environment variable', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      const token = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Secret not defined');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle authorization header with extra spaces', () => {
      // Arrange
      const mockUser = { id: 1, role: 'user' };
      const token = 'valid.jwt.token';
      req.headers.authorization = `  Bearer   ${token}  `;
      jwt.verify.mockReturnValue(mockUser);

      // Act
      auth(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test_jwt_secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should handle authorization header with multiple Bearer prefixes', () => {
      // Arrange
      const token = 'valid.jwt.token';
      req.headers.authorization = `Bearer Bearer ${token}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle very long token', () => {
      // Arrange
      const longToken = 'a'.repeat(1000) + '.jwt.token';
      req.headers.authorization = `Bearer ${longToken}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Token too long');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle special characters in token', () => {
      // Arrange
      const specialToken = 'token.with-special_chars+symbols';
      req.headers.authorization = `Bearer ${specialToken}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid characters');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('User Role Handling', () => {
    it('should handle user with admin role', () => {
      // Arrange
      const mockUser = { id: 1, role: 'admin' };
      const token = 'admin.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(mockUser);

      // Act
      auth(req, res, next);

      // Assert
      expect(req.user).toEqual(mockUser);
      expect(req.user.role).toBe('admin');
      expect(next).toHaveBeenCalled();
    });

    it('should handle user with user role', () => {
      // Arrange
      const mockUser = { id: 2, role: 'user' };
      const token = 'user.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(mockUser);

      // Act
      auth(req, res, next);

      // Assert
      expect(req.user).toEqual(mockUser);
      expect(req.user.role).toBe('user');
      expect(next).toHaveBeenCalled();
    });

    it('should handle user without role', () => {
      // Arrange
      const mockUser = { id: 3 };
      const token = 'no-role.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(mockUser);

      // Act
      auth(req, res, next);

      // Assert
      expect(req.user).toEqual(mockUser);
      expect(req.user.role).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle jwt.verify throwing unexpected error', () => {
      // Arrange
      const token = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      auth(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle jwt.verify returning null', () => {
      // Arrange
      const token = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(null);

      // Act
      auth(req, res, next);

      // Assert
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should handle jwt.verify returning undefined', () => {
      // Arrange
      const token = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(undefined);

      // Act
      auth(req, res, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
