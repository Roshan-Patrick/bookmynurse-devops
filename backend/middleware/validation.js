const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  }
  next();
};

const validateBooking = [
  body('name', 'name is required').notEmpty(),
  body('mobile', 'mobile is required').notEmpty(),
  body('mobile', 'Invalid mobile number format').isLength({ min: 10, max: 10 }).isNumeric(),
  body('nurseType', 'nurseType is required').notEmpty(),
  body('nurseType', 'Invalid nurse type').isIn(['Registered Nurse', 'Licensed Practical Nurse', 'Certified Nursing Assistant', 'Specialized Nurse']),
  body('location', 'location is required').notEmpty(),
  body('services', 'services is required').notEmpty(),
  body('preferences', 'preferences is required').notEmpty(),
  body('enquiryno', 'enquiryno is required').notEmpty(),
  handleValidationErrors
];

const validateRegistration = [
    body('name', 'name is required').notEmpty(),
    body('mobile', 'mobile is required').notEmpty(),
    body('email', 'email is required').isEmail(),
    body('gender', 'gender is required').notEmpty(),
    body('dob', 'dob is required').isISO8601().toDate(),
    body('education', 'education is required').notEmpty(),
    body('experience', 'experience is required').notEmpty(),
    body('languages', 'languages must be an array with at least one language').isArray({ min: 1 }),
    body('specialization', 'specialization is required').notEmpty(),
    body('address', 'address is required').notEmpty(),
    body('base_location', 'base_location is required').notEmpty(),
    body('serviceopt', 'serviceopt must be an array with at least one option').isArray({ min: 1 }),
    handleValidationErrors
];

const validateUser = [
    body('username', 'username is required').notEmpty(),
    body('username', 'Username can only contain letters, numbers, and underscores').matches(/^[a-zA-Z0-9_]+$/),
    body('password', 'password is required').notEmpty(),
    body('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    body('role', 'Invalid role').optional().isIn(['admin', 'user', 'manager']),
    handleValidationErrors
];

module.exports = {
    validateBooking,
    validateRegistration,
    validateUser
};