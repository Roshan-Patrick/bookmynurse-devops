// Unit Tests for Nursing Controller
const nursingController = require('../controllers/nursing.controller');
const nursingModel = require('../models/nursing.model');

// Mock the model
jest.mock('../models/nursing.model');

describe('Nursing Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('nurseRegController', () => {
    it('should create a booking successfully', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        mobile: '1234567890',
        nurseType: 'Registered Nurse',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day shift',
        enquiryno: 'ENQ001'
      };

      const mockResult = { insertId: 1 };
      nursingModel.createBooking.mockResolvedValue(mockResult);

      // Act
      await nursingController.nurseRegController(req, res);

      // Assert
      expect(nursingModel.createBooking).toHaveBeenCalledWith(
        'John Doe',
        '1234567890',
        'Registered Nurse',
        'New York',
        'General Care',
        'Day shift',
        'ENQ001'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Booking created successfully!',
        data: mockResult
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        mobile: '1234567890',
        nurseType: 'Registered Nurse',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day shift',
        enquiryno: 'ENQ001'
      };

      const mockError = new Error('Database connection failed');
      nursingModel.createBooking.mockRejectedValue(mockError);

      // Act
      await nursingController.nurseRegController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal Server Error'
      });
    });
  });

  describe('getAllBookings', () => {
    it('should get all bookings without filter', async () => {
      // Arrange
      const mockBookings = [
        { id: 1, name: 'John Doe', mobile: '1234567890' },
        { id: 2, name: 'Jane Smith', mobile: '0987654321' }
      ];
      nursingModel.getAllUsers.mockResolvedValue(mockBookings);

      // Act
      await nursingController.getAllBookings(req, res);

      // Assert
      expect(nursingModel.getAllUsers).toHaveBeenCalledWith(null);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockBookings
      });
    });

    it('should get bookings with approval status filter', async () => {
      // Arrange
      req.query.approval_status = 'Approved';
      const mockBookings = [
        { id: 1, name: 'John Doe', approval_status: 'Approved' }
      ];
      nursingModel.getAllUsers.mockResolvedValue(mockBookings);

      // Act
      await nursingController.getAllBookings(req, res);

      // Assert
      expect(nursingModel.getAllUsers).toHaveBeenCalledWith('Approved');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockBookings
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      nursingModel.getAllUsers.mockRejectedValue(mockError);

      // Act
      await nursingController.getAllBookings(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error fetching bookings'
      });
    });
  });

  describe('updateBooking', () => {
    it('should update booking successfully', async () => {
      // Arrange
      req.body = {
        id: 1,
        enquiryno: 'ENQ002',
        name: 'John Updated',
        mobile: '1234567890',
        nurseType: 'Registered Nurse',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day shift'
      };

      const mockResult = { affectedRows: 1 };
      nursingModel.updateBooking.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateBooking(req, res);

      // Assert
      expect(nursingModel.updateBooking).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Booking updated successfully',
        data: mockResult
      });
    });

    it('should return 400 if booking ID is missing', async () => {
      // Arrange
      req.body = {
        enquiryno: 'ENQ002',
        name: 'John Updated'
        // Missing id
      };

      // Act
      await nursingController.updateBooking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Booking ID is required'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      req.body = { id: 1, name: 'John Updated' };
      const mockError = new Error('Database update failed');
      nursingModel.updateBooking.mockRejectedValue(mockError);

      // Act
      await nursingController.updateBooking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to update booking'
      });
    });
  });

  describe('deleteBooking', () => {
    it('should delete booking successfully', async () => {
      // Arrange
      req.params.id = '1';
      const mockResult = { affectedRows: 1 };
      nursingModel.deleteBooking.mockResolvedValue(mockResult);

      // Act
      await nursingController.deleteBooking(req, res);

      // Assert
      expect(nursingModel.deleteBooking).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Booking deleted successfully!'
      });
    });

    it('should return 400 if booking ID is missing', async () => {
      // Arrange
      req.params = {}; // No id

      // Act
      await nursingController.deleteBooking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Booking ID is required'
      });
    });

    it('should return 404 if booking not found', async () => {
      // Arrange
      req.params.id = '999';
      const mockResult = { affectedRows: 0 };
      nursingModel.deleteBooking.mockResolvedValue(mockResult);

      // Act
      await nursingController.deleteBooking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Booking not found'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      req.params.id = '1';
      const mockError = new Error('Database delete failed');
      nursingModel.deleteBooking.mockRejectedValue(mockError);

      // Act
      await nursingController.deleteBooking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });
  });

  describe('updateNurseApprovalStatus', () => {
    it('should update approval status to Ongoing', async () => {
      // Arrange
      req.body = { id: 1, status: 'Ongoing' };
      const mockResult = { affectedRows: 1 };
      nursingModel.updateApprovalStatus.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateNurseApprovalStatus(req, res);

      // Assert
      expect(nursingModel.updateApprovalStatus).toHaveBeenCalledWith(1, 'Ongoing');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration Ongoing successfully'
      });
    });

    it('should update approval status to Complete', async () => {
      // Arrange
      req.body = { id: 1, status: 'Complete' };
      const mockResult = { affectedRows: 1 };
      nursingModel.updateApprovalStatus.mockResolvedValue(mockResult);

      // Act
      await nursingController.updateNurseApprovalStatus(req, res);

      // Assert
      expect(nursingModel.updateApprovalStatus).toHaveBeenCalledWith(1, 'Complete');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration Complete successfully'
      });
    });

    it('should return 400 for invalid status', async () => {
      // Arrange
      req.body = { id: 1, status: 'InvalidStatus' };

      // Act
      await nursingController.updateNurseApprovalStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid approval status'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      req.body = { id: 1, status: 'Ongoing' };
      const mockError = new Error('Database update failed');
      nursingModel.updateApprovalStatus.mockRejectedValue(mockError);

      // Act
      await nursingController.updateNurseApprovalStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error updating approval status'
      });
    });
  });
});
