// Unit Tests for Nursing Model
const nursingModel = require('./nursing.model');
const mysql = require('mysql2');

// Use global mocks from tests/setup.js

describe('Nursing Model Unit Tests', () => {
  let mockPromiseQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get handle to the mock query function from global setup
    const mockPool = mysql.createPool();
    mockPromiseQuery = mockPool.promise().query;
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingModel.createBooking(
        'John Doe',
        '1234567890',
        'Registered Nurse',
        'New York',
        'General Care',
        'Day shift',
        'ENQ001'
      );

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bookings'),
        ['John Doe', '1234567890', 'Registered Nurse', 'New York', 'General Care', 'Day shift', 'ENQ001']
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingModel.createBooking(
        'John Doe',
        '1234567890',
        'Registered Nurse',
        'New York',
        'General Care',
        'Day shift',
        'ENQ001'
      )).rejects.toThrow('Database connection failed');
    });

    it('should throw error for unexpected database result', async () => {
      // Arrange
      const mockResult = null; // Unexpected result
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act & Assert
      await expect(nursingModel.createBooking(
        'John Doe',
        '1234567890',
        'Registered Nurse',
        'New York',
        'General Care',
        'Day shift',
        'ENQ001'
      )).rejects.toThrow('Database insert did not return expected result.');
    });

    it('should throw error for missing insertId', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 }; // Missing insertId
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act & Assert
      await expect(nursingModel.createBooking(
        'John Doe',
        '1234567890',
        'Registered Nurse',
        'New York',
        'General Care',
        'Day shift',
        'ENQ001'
      )).rejects.toThrow('Database insert did not return expected result.');
    });
  });

  describe('getAllUsers', () => {
    it('should get all bookings without filter', async () => {
      // Arrange
      const mockBookings = [
        { id: 1, name: 'John Doe', mobile: '1234567890' },
        { id: 2, name: 'Jane Smith', mobile: '0987654321' }
      ];
      mockPromiseQuery.mockResolvedValue([mockBookings, []]);

      // Act
      const result = await nursingModel.getAllUsers();

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT * FROM bookings', []);
      expect(result).toEqual(mockBookings);
    });

    it('should get bookings with approval status filter', async () => {
      // Arrange
      const mockBookings = [
        { id: 1, name: 'John Doe', approval_status: 'Approved' }
      ];
      mockPromiseQuery.mockResolvedValue([mockBookings, []]);

      // Act
      const result = await nursingModel.getAllUsers('Approved');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT * FROM bookings WHERE approval_status = ?', ['Approved']);
      expect(result).toEqual(mockBookings);
    });

    it('should handle single result object', async () => {
      // Arrange
      const mockBooking = { id: 1, name: 'John Doe', mobile: '1234567890' };
      mockPromiseQuery.mockResolvedValue([[mockBooking], []]);

      // Act
      const result = await nursingModel.getAllUsers();

      // Assert
      expect(result).toEqual([mockBooking]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingModel.getAllUsers()).rejects.toEqual({ error: 'Database query failed' });
    });
  });

  describe('updateBooking', () => {
    it('should update a booking successfully', async () => {
      // Arrange
      const bookingData = {
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
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingModel.updateBooking(bookingData);

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE bookings'),
        ['ENQ002', 'John Updated', '1234567890', 'Registered Nurse', 'New York', 'General Care', 'Day shift', 1]
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw error for unexpected database result', async () => {
      // Arrange
      const bookingData = {
        id: 1,
        enquiryno: 'ENQ002',
        name: 'John Updated',
        mobile: '1234567890',
        nurseType: 'Registered Nurse',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day shift'
      };
      const mockResult = null; // Unexpected result
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act & Assert
      await expect(nursingModel.updateBooking(bookingData)).rejects.toThrow('Database update did not return expected result.');
    });

    it('should throw error for missing affectedRows', async () => {
      // Arrange
      const bookingData = {
        id: 1,
        enquiryno: 'ENQ002',
        name: 'John Updated',
        mobile: '1234567890',
        nurseType: 'Registered Nurse',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day shift'
      };
      const mockResult = { insertId: 1 }; // Missing affectedRows
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act & Assert
      await expect(nursingModel.updateBooking(bookingData)).rejects.toThrow('Database update did not return expected result.');
    });

    it('should handle database errors', async () => {
      // Arrange
      const bookingData = {
        id: 1,
        enquiryno: 'ENQ002',
        name: 'John Updated',
        mobile: '1234567890',
        nurseType: 'Registered Nurse',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day shift'
      };
      const mockError = new Error('Database update failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingModel.updateBooking(bookingData)).rejects.toThrow('Database update failed');
    });
  });

  describe('deleteBooking', () => {
    it('should delete a booking successfully', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingModel.deleteBooking(1);

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('DELETE FROM bookings WHERE id = ?', [1]);
      expect(result).toEqual(mockResult);
    });

    it('should throw error for unexpected database result', async () => {
      // Arrange
      const mockResult = null; // Unexpected result
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act & Assert
      await expect(nursingModel.deleteBooking(1)).rejects.toThrow('Database delete did not return expected result.');
    });

    it('should throw error for missing affectedRows', async () => {
      // Arrange
      const mockResult = { insertId: 1 }; // Missing affectedRows
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act & Assert
      await expect(nursingModel.deleteBooking(1)).rejects.toThrow('Database delete did not return expected result.');
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database delete failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingModel.deleteBooking(1)).rejects.toThrow('Database delete failed');
    });
  });

  describe('updateApprovalStatus', () => {
    it('should update approval status successfully', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingModel.updateApprovalStatus(1, 'Ongoing');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('UPDATE bookings SET approval_status = ? WHERE id = ?', ['Ongoing', 1]);
      expect(result).toEqual(mockResult);
    });

    it('should throw error for unexpected database result', async () => {
      // Arrange
      const mockResult = null; // Unexpected result
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act & Assert
      await expect(nursingModel.updateApprovalStatus(1, 'Ongoing')).rejects.toThrow('Database update did not return expected result.');
    });

    it('should throw error for missing affectedRows', async () => {
      // Arrange
      const mockResult = { insertId: 1 }; // Missing affectedRows
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act & Assert
      await expect(nursingModel.updateApprovalStatus(1, 'Ongoing')).rejects.toThrow('Database update did not return expected result.');
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database update failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingModel.updateApprovalStatus(1, 'Ongoing')).rejects.toThrow('Database update failed');
    });
  });
});
