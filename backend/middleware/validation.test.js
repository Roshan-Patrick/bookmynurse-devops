const { validationResult } = require('express-validator');
const { validateUser, validateBooking, validateRegistration } = require('./validation');

// Mock the express-validator library
jest.mock('express-validator', () => ({
  ...jest.requireActual('express-validator'),
  validationResult: jest.fn(),
}));

// Helper function to run an array of middlewares
const runMiddlewareChain = async (req, res, next, chain) => {
  for (const middleware of chain) {
    if (res.headersSent) break;
    await middleware(req, res, next);
  }
};

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => {
        res.headersSent = true;
      }),
      headersSent: false,
    };
    next = jest.fn();
    // Default mock for a clean validation result
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should call next() for valid user data', async () => {
      await runMiddlewareChain(req, res, next, validateUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 for missing username and password', async () => {
      const errors = [{ msg: 'username is required' }, { msg: 'password is required' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });
      await runMiddlewareChain(req, res, next, validateUser);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: ['username is required', 'password is required'] });
    });
  });

  describe('validateBooking', () => {
    it('should call next() for valid booking data', async () => {
        await runMiddlewareChain(req, res, next, validateBooking);
        expect(next).toHaveBeenCalled();
    });

    it('should return 400 for invalid mobile number', async () => {
        validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid mobile number format' }] });
        await runMiddlewareChain(req, res, next, validateBooking);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ['Invalid mobile number format'] });
    });
  });

  describe('validateRegistration', () => {
    it('should call next() for valid registration data', async () => {
        await runMiddlewareChain(req, res, next, validateRegistration);
        expect(next).toHaveBeenCalled();
    });

    it('should return 400 for invalid email', async () => {
        validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid email format' }] });
        await runMiddlewareChain(req, res, next, validateRegistration);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ['Invalid email format'] });
    });
  });
});