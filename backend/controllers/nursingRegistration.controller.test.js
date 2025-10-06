// Unit Tests for Nursing Registration Controller
const nursingController = require('../controllers/nursingRegistration.controller');
const nursingRegistrationModel = require('../models/nursingRegistration.model');

// Mock the model
jest.mock('../models/nursingRegistration.model');

describe('Nursing Registration Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.resetModules();
    req = {
      body: {},
      params: {},
      query: {},
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('registerNurse', () => {
    it('should register a nurse successfully', async () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '1234567890',
        email: 'jane@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: '["English","Spanish"]',
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'New York',
        serviceopt: '["General Care", "Emergency Care"]'
      };
      req.file = { path: '/uploads/test-image.jpg' };

      const mockImageId = 1;
      const mockRegistrationId = 1;
      nursingRegistrationModel.insertImg.mockResolvedValue(mockImageId);
      nursingRegistrationModel.insertRegistration.mockResolvedValue(mockRegistrationId);

      // Act
      await nursingController.registerNurse(req, res);

      // Assert
      expect(nursingRegistrationModel.insertImg).toHaveBeenCalledWith('/uploads/test-image.jpg');
      expect(nursingRegistrationModel.insertRegistration).toHaveBeenCalledWith({
        name: 'Jane Doe',
        mobile: '1234567890',
        email: 'jane@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: '["English","Spanish"]',
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'New York',
        serviceopt: '["General Care","Emergency Care"]',
        imageId: 1
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        registrationId: 1,
        message: 'Registration successful. Please check your email for confirmation.'
      });
    });

    it('should return 400 if no image file provided', async () => {
      // Arrange
      req.body = {
        name: 'Jane Doe',
        mobile: '1234567890',
        email: 'jane@example.com'
      };
      req.file = null;

      // Act
      await nursingController.registerNurse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Image file is required'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      req.body = {
        name: 'Jane Doe',
        mobile: '1234567890',
        email: 'jane@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: '["English"]',
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'New York',
        serviceopt: '["General Care"]'
      };
      req.file = { path: '/uploads/test-image.jpg' };

      const mockError = new Error('Database connection failed');
      nursingRegistrationModel.insertImg.mockRejectedValue(mockError);

      // Act
      await nursingController.registerNurse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error processing registration',
        error: process.env.NODE_ENV === 'development' ? mockError.message : undefined
      });
      consoleErrorSpy.mockRestore();
    });

    it('should attempt to send an email if SMTP is configured', async () => {
      // Arrange
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';

      const nodemailer = require('nodemailer');
      const mockSendMail = jest.fn().mockResolvedValue(true);
      nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

      req.body = {
        name: 'Jane Doe',
        mobile: '1234567890',
        email: 'jane@example.com',
        languages: '[]',
        serviceopt: '[]'
      };
      req.file = { path: '/uploads/test-image.jpg' };

      nursingRegistrationModel.insertImg.mockResolvedValue(1);
      nursingRegistrationModel.insertRegistration.mockResolvedValue(1);

      // Dynamically require the controller to re-evaluate the transporter
      const nursingControllerWithSmtp = require('./nursingRegistration.controller');

      // Act
      await nursingControllerWithSmtp.registerNurse(req, res);

      // Assert
      expect(mockSendMail).toHaveBeenCalled();

      // Cleanup
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
    });
  });

  describe('fetchAllRegistrationsNurse', () => {
    it('should fetch all registrations without filter', async () => {
      // Arrange
      const mockRegistrations = [
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          approval_status: 'Pending',
          languages: '["English"]',
          serviceopt: '["General Care"]',
          file_path: '/uploads/test.jpg'
        }
      ];
      nursingRegistrationModel.getAllRegistrations.mockResolvedValue(mockRegistrations);

      // Act
      await nursingController.fetchAllRegistrationsNurse(req, res);

      // Assert
      expect(nursingRegistrationModel.getAllRegistrations).toHaveBeenCalledWith(null);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRegistrations
      });
    });

    it('should fetch registrations with approval status filter', async () => {
      // Arrange
      req.query.approval_status = 'Approved';
      const mockRegistrations = [
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          approval_status: 'Approved',
          languages: '["English"]',
          serviceopt: '["General Care"]',
          file_path: '/uploads/test.jpg'
        }
      ];
      nursingRegistrationModel.getAllRegistrations.mockResolvedValue(mockRegistrations);

      // Act
      await nursingController.fetchAllRegistrationsNurse(req, res);

      // Assert
      expect(nursingRegistrationModel.getAllRegistrations).toHaveBeenCalledWith('Approved');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRegistrations
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Database query failed');
      nursingRegistrationModel.getAllRegistrations.mockRejectedValue(mockError);

      // Act
      await nursingController.fetchAllRegistrationsNurse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching registrations',
        error: process.env.NODE_ENV === 'development' ? mockError.message : undefined
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateApprovalStatus', () => {
    it('should update approval status to Approved', async () => {
      // Arrange
      req.body = { id: 1, status: 'Approved' };
      const mockResult = { affectedRows: 1 };
      nursingRegistrationModel.updateApprovalStatus.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateApprovalStatus(req, res);

      // Assert
      expect(nursingRegistrationModel.updateApprovalStatus).toHaveBeenCalledWith(1, 'Approved');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration Approved successfully'
      });
    });

    it('should update approval status to Rejected', async () => {
      // Arrange
      req.body = { id: 1, status: 'Rejected' };
      const mockResult = { affectedRows: 1 };
      nursingRegistrationModel.updateApprovalStatus.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateApprovalStatus(req, res);

      // Assert
      expect(nursingRegistrationModel.updateApprovalStatus).toHaveBeenCalledWith(1, 'Rejected');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration Rejected successfully'
      });
    });

    it('should return 400 for invalid status', async () => {
      // Arrange
      req.body = { id: 1, status: 'InvalidStatus' };

      // Act
      await nursingController.updateApprovalStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid approval status'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      req.body = { id: 1, status: 'Approved' };
      const mockError = new Error('Database update failed');
      nursingRegistrationModel.updateApprovalStatus.mockRejectedValue(mockError);

      // Act
      await nursingController.updateApprovalStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error updating approval status'
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateAvailableStatus', () => {
    it('should update availability status to Available', async () => {
      // Arrange
      req.body = { id: 1, status: 'Available' };
      const mockResult = { affectedRows: 1 };
      nursingRegistrationModel.updateAvailableStatus.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateAvailableStatus(req, res);

      // Assert
      expect(nursingRegistrationModel.updateAvailableStatus).toHaveBeenCalledWith(1, 'Available');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Availability status updated to Available'
      });
    });

    it('should update availability status to Unavailable', async () => {
      // Arrange
      req.body = { id: 1, status: 'Unavailable' };
      const mockResult = { affectedRows: 1 };
      nursingRegistrationModel.updateAvailableStatus.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateAvailableStatus(req, res);

      // Assert
      expect(nursingRegistrationModel.updateAvailableStatus).toHaveBeenCalledWith(1, 'Unavailable');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Availability status updated to Unavailable'
      });
    });

    it('should return 400 for invalid status', async () => {
      // Arrange
      req.body = { id: 1, status: 'InvalidStatus' };

      // Act
      await nursingController.updateAvailableStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid availability status'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      req.body = { id: 1, status: 'Available' };
      const mockError = new Error('Database update failed');
      nursingRegistrationModel.updateAvailableStatus.mockRejectedValue(mockError);

      // Act
      await nursingController.updateAvailableStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error updating availability status'
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('revertApprovalStatus', () => {
    it('should revert approval status to pending', async () => {
      // Arrange
      req.body = { id: 1 };
      const mockResult = { affectedRows: 1 };
      nursingRegistrationModel.revertApprovalStatus.mockResolvedValue(mockResult);

      // Act
      await nursingController.revertApprovalStatus(req, res);

      // Assert
      expect(nursingRegistrationModel.revertApprovalStatus).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Approval status reverted to pending'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      req.body = { id: 1 };
      const mockError = new Error('Database update failed');
      nursingRegistrationModel.revertApprovalStatus.mockRejectedValue(mockError);

      // Act
      await nursingController.revertApprovalStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error reverting approval status'
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('editNurse', () => {
    it('should update nurse details successfully', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        name: 'Jane Updated',
        mobile: '1234567890',
        email: 'jane.updated@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Master of Nursing',
        experience: '7 years',
        languages: ['English', 'Spanish'],
        specialization: 'ICU Care',
        address: '456 Updated St',
        base_location: 'Los Angeles',
        serviceopt: ['General Care', 'Emergency Care']
      };

      const mockResult = { affectedRows: 1 };
      nursingRegistrationModel.updateNurse.mockResolvedValue(mockResult);

      // Act
      await nursingController.editNurse(req, res);

      // Assert
      expect(nursingRegistrationModel.updateNurse).toHaveBeenCalledWith('1', {
        name: 'Jane Updated',
        mobile: '1234567890',
        email: 'jane.updated@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Master of Nursing',
        experience: '7 years',
        languages: '["English","Spanish"]',
        specialization: 'ICU Care',
        address: '456 Updated St',
        base_location: 'Los Angeles',
        serviceopt: '["General Care","Emergency Care"]'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Nurse details updated successfully!'
      });
    });

    it('should return 400 if nurse ID is missing', async () => {
      // Arrange
      req.params = {}; // No id
      req.body = { name: 'Jane Updated' };

      // Act
      await nursingController.editNurse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Nurse ID is required for updating.'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      req.params.id = '1';
      req.body = { name: 'Jane Updated' };
      const mockError = new Error('Database update failed');
      nursingRegistrationModel.updateNurse.mockRejectedValue(mockError);

      // Act
      await nursingController.editNurse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateCharges', () => {
    it('should update charges successfully', async () => {
      // Arrange
      req.params.id = '1';
      req.body = { charges: 500, charges_type: 'per_hour' };

      const mockResult = { affectedRows: 1 };
      nursingRegistrationModel.updateCharges.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateCharges(req, res);

      // Assert
      expect(nursingRegistrationModel.updateCharges).toHaveBeenCalledWith('1', 500, 'per_hour');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Charges updated successfully'
      });
    });

    it('should return 400 if charges is invalid', async () => {
      // Arrange
      req.params.id = '1';
      req.body = { charges: 'invalid', charges_type: 'per_hour' };

      // Act
      await nursingController.updateCharges(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Valid charges amount required'
      });
    });

    it('should return 400 if charges is missing', async () => {
      // Arrange
      req.params.id = '1';
      req.body = { charges_type: 'per_hour' }; // Missing charges

      // Act
      await nursingController.updateCharges(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Valid charges amount required'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      req.params.id = '1';
      req.body = { charges: 500, charges_type: 'per_hour' };
      const mockError = new Error('Database update failed');
      nursingRegistrationModel.updateCharges.mockRejectedValue(mockError);

      // Act
      await nursingController.updateCharges(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error updating charges'
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateNurseId', () => {
    it('should update nurse ID successfully', async () => {
      // Arrange
      req.body = { bookingId: 1, nurseId: 2 };

      const mockResult = { affectedRows: 1 };
      nursingRegistrationModel.updateNurseId.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateNurseId(req, res);

      // Assert
      expect(nursingRegistrationModel.updateNurseId).toHaveBeenCalledWith(1, 2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Nurse ID updated successfully'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      req.body = { bookingId: 1, nurseId: 2 };
      const mockError = new Error('Database update failed');
      nursingRegistrationModel.updateNurseId.mockRejectedValue(mockError);

      // Act
      await nursingController.updateNurseId(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getNurseDetailsFromBooking', () => {
    it('should fetch nurse details successfully', async () => {
      // Arrange
      req.params.id = '1';
      const mockNurse = {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        specialization: 'ICU Care'
      };
      nursingRegistrationModel.fetchNurseDetails.mockResolvedValue(mockNurse);

      // Act
      await nursingController.getNurseDetailsFromBooking(req, res);

      // Assert
      expect(nursingRegistrationModel.fetchNurseDetails).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        nurse: mockNurse
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      req.params.id = '1';
      const mockError = new Error('Database query failed');
      nursingRegistrationModel.fetchNurseDetails.mockRejectedValue(mockError);

      // Act
      await nursingController.getNurseDetailsFromBooking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
      consoleErrorSpy.mockRestore();
    });
  });
});
