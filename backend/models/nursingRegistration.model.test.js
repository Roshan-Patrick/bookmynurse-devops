// Unit Tests for Nursing Registration Model
const nursingRegistrationModel = require('./nursingRegistration.model');
const mysql = require('mysql2');

// Use global mocks from tests/setup.js

describe('Nursing Registration Model Unit Tests', () => {
  let mockPromiseQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get handle to the mock query function from global setup
    const mockPool = mysql.createPool();
    mockPromiseQuery = mockPool.promise().query;
  });

  describe('insertImg', () => {
    it('should insert image successfully', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingRegistrationModel.insertImg('/uploads/test.jpg');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('INSERT INTO images (file_path) VALUES (?)', ['/uploads/test.jpg']);
      expect(result).toBe(1);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.insertImg('/uploads/test.jpg')).rejects.toThrow('Database connection failed');
    });
  });

  describe('insertRegistration', () => {
    it('should insert registration successfully', async () => {
      // Arrange
      const registrationData = {
        name: 'Jane Doe',
        mobile: '1234567890',
        email: 'jane@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: '["English", "Spanish"]',
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'New York',
        serviceopt: '["General Care"]',
        imageId: 1
      };
      const mockResult = { insertId: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingRegistrationModel.insertRegistration(registrationData);

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO registration'),
        [
          'Jane Doe', '1234567890', 'jane@example.com', 'Female', '1990-01-01',
          'Bachelor of Nursing', '5 years', '["English", "Spanish"]', 'ICU Care',
          '123 Main St', 'New York', '["General Care"]', 1
        ]
      );
      expect(result).toBe(1);
    });

    it('should handle database errors', async () => {
      // Arrange
      const registrationData = {
        name: 'Jane Doe',
        mobile: '1234567890',
        email: 'jane@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Bachelor of Nursing',
        experience: '5 years',
        languages: '["English", "Spanish"]',
        specialization: 'ICU Care',
        address: '123 Main St',
        base_location: 'New York',
        serviceopt: '["General Care"]',
        imageId: 1
      };
      const mockError = new Error('Database connection failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.insertRegistration(registrationData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateApprovalStatus', () => {
    it('should update approval status successfully', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingRegistrationModel.updateApprovalStatus(1, 'Approved');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('UPDATE registration SET approval_status = ? WHERE id = ?', ['Approved', 1]);
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database update failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.updateApprovalStatus(1, 'Approved')).rejects.toThrow('Database update failed');
    });
  });

  describe('updateAvailableStatus', () => {
    it('should update availability status successfully', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingRegistrationModel.updateAvailableStatus(1, 'Available');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('UPDATE registration SET availability = ? WHERE id = ?', ['Available', 1]);
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database update failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.updateAvailableStatus(1, 'Available')).rejects.toThrow('Database update failed');
    });
  });

  describe('revertApprovalStatus', () => {
    it('should revert approval status to pending successfully', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingRegistrationModel.revertApprovalStatus(1);

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('UPDATE registration SET approval_status = "Pending" WHERE id = ?', [1]);
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database update failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.revertApprovalStatus(1)).rejects.toThrow('Database update failed');
    });
  });

  describe('updateNurse', () => {
    it('should update nurse details successfully', async () => {
      // Arrange
      const updatedData = {
        name: 'Jane Updated',
        mobile: '1234567890',
        email: 'jane.updated@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Master of Nursing',
        experience: '7 years',
        languages: '["English", "Spanish"]',
        specialization: 'ICU Care',
        address: '456 Updated St',
        base_location: 'Los Angeles',
        serviceopt: '["General Care", "Emergency Care"]'
      };
      const mockResult = { affectedRows: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingRegistrationModel.updateNurse(1, updatedData);

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE registration'),
        [
          'Jane Updated', '1234567890', 'jane.updated@example.com', 'Female', '1990-01-01',
          'Master of Nursing', '7 years', '["English", "Spanish"]', 'ICU Care',
          '456 Updated St', 'Los Angeles', '["General Care", "Emergency Care"]', 1
        ]
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const updatedData = {
        name: 'Jane Updated',
        mobile: '1234567890',
        email: 'jane.updated@example.com',
        gender: 'Female',
        dob: '1990-01-01',
        education: 'Master of Nursing',
        experience: '7 years',
        languages: '["English", "Spanish"]',
        specialization: 'ICU Care',
        address: '456 Updated St',
        base_location: 'Los Angeles',
        serviceopt: '["General Care", "Emergency Care"]'
      };
      const mockError = new Error('Database update failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.updateNurse(1, updatedData)).rejects.toThrow('Database update failed');
    });
  });

  describe('getAllRegistrations', () => {
    it('should get all registrations without filter', async () => {
      // Arrange
      const mockRegistrations = [
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          languages: '["English"]',
          serviceopt: '["General Care"]',
          file_path: '/uploads/test.jpg'
        }
      ];
      mockPromiseQuery.mockResolvedValue([mockRegistrations, []]);

      // Act
      const result = await nursingRegistrationModel.getAllRegistrations();

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT r.*'),
        []
      );
      expect(result).toEqual([
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          languages: ['English'],
          serviceopt: ['General Care'],
          file_path: '/uploads/test.jpg'
        }
      ]);
    });

    it('should get registrations with approval status filter', async () => {
      // Arrange
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
      mockPromiseQuery.mockResolvedValue([mockRegistrations, []]);

      // Act
      const result = await nursingRegistrationModel.getAllRegistrations('Approved');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE r.approval_status = ?'),
        ['Approved']
      );
      expect(result).toEqual([
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          approval_status: 'Approved',
          languages: ['English'],
          serviceopt: ['General Care'],
          file_path: '/uploads/test.jpg'
        }
      ]);
    });

    it('should handle single result object', async () => {
      // Arrange
      const mockRegistration = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        languages: '["English"]',
        serviceopt: '["General Care"]',
        file_path: '/uploads/test.jpg'
      };
      mockPromiseQuery.mockResolvedValue([[mockRegistration], []]);

      // Act
      const result = await nursingRegistrationModel.getAllRegistrations();

      // Assert
      expect(result).toEqual([{
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        languages: ['English'],
        serviceopt: ['General Care'],
        file_path: '/uploads/test.jpg'
      }]);
    });

    it('should handle null languages and serviceopt', async () => {
      // Arrange
      const mockRegistrations = [
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          languages: null,
          serviceopt: null,
          file_path: '/uploads/test.jpg'
        }
      ];
      mockPromiseQuery.mockResolvedValue([mockRegistrations, []]);

      // Act
      const result = await nursingRegistrationModel.getAllRegistrations();

      // Assert
      expect(result).toEqual([
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          languages: [],
          serviceopt: [],
          file_path: '/uploads/test.jpg'
        }
      ]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.getAllRegistrations()).rejects.toThrow('Database query failed');
    });
  });

  describe('updateCharges', () => {
    it('should update charges successfully', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingRegistrationModel.updateCharges(1, 500, 'per_hour');

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('UPDATE registration SET charges = ?, charges_type = ? WHERE id = ?', [500, 'per_hour', 1]);
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database update failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.updateCharges(1, 500, 'per_hour')).rejects.toThrow('Database update failed');
    });
  });

  describe('updateNurseId', () => {
    it('should update nurse ID successfully', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 };
      mockPromiseQuery.mockResolvedValue([mockResult, []]);

      // Act
      const result = await nursingRegistrationModel.updateNurseId(1, 2);

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith('UPDATE bookings SET nurse_id = ? WHERE id = ?', [2, 1]);
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database update failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.updateNurseId(1, 2)).rejects.toThrow('Database update failed');
    });
  });

  describe('fetchNurseDetails', () => {
    it('should fetch nurse details successfully', async () => {
      // Arrange
      const mockNurse = {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        specialization: 'ICU Care'
      };
      mockPromiseQuery.mockResolvedValue([[mockNurse], []]);

      // Act
      const result = await nursingRegistrationModel.fetchNurseDetails(1);

      // Assert
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT r.*'),
        [1]
      );
      expect(result).toEqual(mockNurse);
    });

    it('should return null if no nurse found', async () => {
      // Arrange
      mockPromiseQuery.mockResolvedValue([[], []]);

      // Act
      const result = await nursingRegistrationModel.fetchNurseDetails(999);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockError = new Error('Database query failed');
      mockPromiseQuery.mockRejectedValue(mockError);

      // Act & Assert
      await expect(nursingRegistrationModel.fetchNurseDetails(1)).rejects.toThrow('Database query failed');
    });
  });
});
