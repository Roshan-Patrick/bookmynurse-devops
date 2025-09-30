const { validationResult } = require('express-validator');
const { validateBooking, validateRegistration, validateUser } = require('./validation');

// Mock the validationResult function from express-validator
jest.mock('express-validator', () => ({
  ...jest.requireActual('express-validator'), // import and retain all other functions
  validationResult: jest.fn(),
}));

// Helper function to run the middleware chain
const runMiddleware = async (req, res, next, middlewares) => {
  for (const middleware of middlewares) {
    // Stop if a response has been sent
    if (res.headersSent) {
      break;
    }
    await middleware(req, res, next);
  }
};

describe('Validation Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
      // Add headersSent property to simulate response sending
      headersSent: false,
    };
    // When res.json() is called, simulate that headers have been sent
    res.json.mockImplementation(() => {
      res.headersSent = true;
    });
    next = jest.fn();

    // Default mock for validationResult: no errors
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should call next() for valid user data', async () => {
      await runMiddleware(req, res, next, validateUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing username and password', async () => {
      const errors = [{ msg: 'username is required' }, { msg: 'password is required' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await runMiddleware(req, res, next, validateUser);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: ['username is required', 'password is required'] });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 for short password', async () => {
        const errors = [{ msg: 'Password must be at least 6 characters long' }];
        validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });
  
        await runMiddleware(req, res, next, validateUser);
  
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ['Password must be at least 6 characters long'] });
        expect(next).not.toHaveBeenCalled();
      });
  });

  describe('validateBooking', () => {
    it('should call next() for valid booking data', async () => {
        await runMiddleware(req, res, next, validateBooking);
        expect(next).toHaveBeenCalled();
    });

    it('should return 400 for multiple missing fields', async () => {
        const errors = [{ msg: 'name is required' }, { msg: 'mobile is required' }];
        validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

        await runMiddleware(req, res, next, validateBooking);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ['name is required', 'mobile is required'] });
        expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateRegistration', () => {
    it('should call next() for valid registration data', async () => {
        await runMiddleware(req, res, next, validateRegistration);
        expect(next).toHaveBeenCalled();
    });

    it('should return 400 for invalid email and missing name', async () => {
        const errors = [{ msg: 'name is required' }, { msg: 'Invalid email format' }];
        validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

        await runMiddleware(req, res, next, validateRegistration);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ['name is required', 'Invalid email format'] });
        expect(next).not.toHaveBeenCalled();
    });
  });
});
