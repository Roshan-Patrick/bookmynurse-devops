// Unit Tests for Validation Middleware
const { validateBooking, validateRegistration, validateUser } = require('./validation');

describe('Validation Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBooking', () => {
    it('should pass validation for valid booking data', () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        mobile: '1234567890',
        nurseType: 'RN',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day Shift',
        enquiryno: 'ENQ001'
      };

      // Act
      validateBooking(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation for missing required fields', () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        mobile: '1234567890'
        // Missing other required fields
      };

      // Act
      validateBooking(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: nurseType, location, services, preferences, enquiryno'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for empty required fields', () => {
      // Arrange
      req.body = {
        name: '',
        mobile: '1234567890',
        nurseType: 'RN',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day Shift',
        enquiryno: 'ENQ001'
      };

      // Act
      validateBooking(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Required fields cannot be empty'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for invalid mobile number', () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        mobile: 'invalid-mobile',
        nurseType: 'RN',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day Shift',
        enquiryno: 'ENQ001'
      };

      // Act
      validateBooking(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid mobile number format'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for invalid nurse type', () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        mobile: '1234567890',
        nurseType: 'InvalidType',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day Shift',
        enquiryno: 'ENQ001'
      };

      // Act
      validateBooking(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid nurse type'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass validation for valid nurse types', () => {
      const validNurseTypes = ['RN', 'LVN', 'CNA', 'HHA'];

      validNurseTypes.forEach(nurseType => {
        // Arrange
        req.body = {
          name: 'John Doe',
          mobile: '1234567890',
          nurseType: nurseType,
          location: 'New York',
          services: 'General Care',
          preferences: 'Day Shift',
          enquiryno: 'ENQ001'
        };

        // Act
        validateBooking(req, res, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();

        // Reset mocks for next iteration
        jest.clearAllMocks();
      });
    });
  });

  describe('validateRegistration', () => {
    it('should pass validation for valid registration data', () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '0987654321',
        email: 'jane@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: ['English', 'Spanish'],
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'Los Angeles',
        serviceopt: ['Home Care']
      };

      // Act
      validateRegistration(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation for missing required fields', () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '0987654321'
        // Missing other required fields
      };

      // Act
      validateRegistration(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: email, gender, dob, education, experience, languages, specialization, address, base_location, serviceopt'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for invalid email format', () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '0987654321',
        email: 'invalid-email',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: ['English'],
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'Los Angeles',
        serviceopt: ['Home Care']
      };

      // Act
      validateRegistration(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid email format'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for invalid gender', () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '0987654321',
        email: 'jane@example.com',
        gender: 'InvalidGender',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: ['English'],
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'Los Angeles',
        serviceopt: ['Home Care']
      };

      // Act
      validateRegistration(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid gender'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass validation for valid genders', () => {
      const validGenders = ['Male', 'Female', 'Other'];

      validGenders.forEach(gender => {
        // Arrange
        req.body = {
          name: 'Jane Doe',
          mobile: '0987654321',
          email: 'jane@example.com',
          gender: gender,
          dob: '1990-01-01',
          education: 'Bachelor of Nursing',
          experience: '5 years',
          languages: ['English'],
          specialization: 'ICU Care',
          address: '123 Main St',
          base_location: 'Los Angeles',
          serviceopt: ['Home Care']
        };

        // Act
        validateRegistration(req, res, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();

        // Reset mocks for next iteration
        jest.clearAllMocks();
      });
    });

    it('should fail validation for invalid date of birth', () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '0987654321',
        email: 'jane@example.com',
        gender: 'Female',
        dob: 'invalid-date',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: ['English'],
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'Los Angeles',
        serviceopt: ['Home Care']
      };

      // Act
      validateRegistration(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid date of birth format'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for future date of birth', () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      req.body = {
        name: 'Jane Doe',
        mobile: '0987654321',
        email: 'jane@example.com',
        gender: 'Female',
        dob: futureDateString,
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: ['English'],
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'Los Angeles',
        serviceopt: ['Home Care']
      };

      // Act
      validateRegistration(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Date of birth cannot be in the future'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for empty languages array', () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '0987654321',
        email: 'jane@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: [],
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'Los Angeles',
        serviceopt: ['Home Care']
      };

      // Act
      validateRegistration(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'At least one language must be specified'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for empty service options array', () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '0987654321',
        email: 'jane@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: ['English'],
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'Los Angeles',
        serviceopt: []
      };

      // Act
      validateRegistration(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'At least one service option must be specified'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should pass validation for valid user data', () => {
      // Arrange
      req.body = {
        username: 'testuser',
        password: 'password123',
        role: 'admin'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass validation for user without role', () => {
      // Arrange
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation for missing username', () => {
      // Arrange
      req.body = {
        password: 'password123',
        role: 'admin'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: username, password'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for missing password', () => {
      // Arrange
      req.body = {
        username: 'testuser',
        role: 'admin'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: username, password'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for empty username', () => {
      // Arrange
      req.body = {
        username: '',
        password: 'password123',
        role: 'admin'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Required fields cannot be empty'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for empty password', () => {
      // Arrange
      req.body = {
        username: 'testuser',
        password: '',
        role: 'admin'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Required fields cannot be empty'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for short password', () => {
      // Arrange
      req.body = {
        username: 'testuser',
        password: '123',
        role: 'admin'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password must be at least 6 characters long'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation for invalid role', () => {
      // Arrange
      req.body = {
        username: 'testuser',
        password: 'password123',
        role: 'invalidrole'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid role'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass validation for valid roles', () => {
      const validRoles = ['admin', 'user'];

      validRoles.forEach(role => {
        // Arrange
        req.body = {
          username: 'testuser',
          password: 'password123',
          role: role
        };

        // Act
        validateUser(req, res, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();

        // Reset mocks for next iteration
        jest.clearAllMocks();
      });
    });

    it('should fail validation for username with special characters', () => {
      // Arrange
      req.body = {
        username: 'test@user#',
        password: 'password123',
        role: 'admin'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Username can only contain letters, numbers, and underscores'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass validation for username with valid characters', () => {
      // Arrange
      req.body = {
        username: 'test_user123',
        password: 'password123',
        role: 'admin'
      };

      // Act
      validateUser(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
