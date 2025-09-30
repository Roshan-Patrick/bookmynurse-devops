const { validationResult } = require('express-validator');
const { validateUser } = require('../middleware/validation');

jest.mock('express-validator', () => ({
    ...jest.requireActual('express-validator'),
    validationResult: jest.fn(),
}));

describe('Validation Middleware', () => {
    let req, res, next;
    const handleValidationErrors = validateUser[validateUser.length - 1];

    beforeEach(() => {
        req = { body: {} };
        res = { status: jest.fn(() => res), json: jest.fn() };
        next = jest.fn();
    });

    it('should call next() when there are no validation errors', () => {
        validationResult.mockReturnValue({ isEmpty: () => true });
        handleValidationErrors(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should return 400 with errors when validation fails', () => {
        const errors = [{ msg: 'username is required' }];
        validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });
        handleValidationErrors(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ['username is required'] });
    });
});