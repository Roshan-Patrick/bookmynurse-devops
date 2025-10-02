// Unit Tests for Database Models
const nursingModel = require('../models/nursing.model');
const nursingRegistrationModel = require('../models/nursingRegistration.model');
const userModel = require('../models/userModel');
const mysql = require('mysql2');

// Use global mocks from tests/setup.js

describe('Database Models Unit Tests', () => {
  let mockPromiseQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get handle to the mock query function from global setup
    const mockPool = mysql.createPool();
    mockPromiseQuery = mockPool.promise().query;
  });

  describe('Nursing Model', () => {
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
    });
  });

  describe('Nursing Registration Model', () => {
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
    });
  });

  describe('User Model', () => {
    describe('create', () => {
      it('should create a user with role successfully', async () => {
        // Arrange
        const mockResult = { insertId: 1 };
        mockPromiseQuery.mockResolvedValue([mockResult, []]);

        // Act
        const result = await userModel.create('newuser', 'password123', 'admin');

        // Assert
        expect(mockPromiseQuery).toHaveBeenCalledWith(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          ['newuser', 'hashed_password123', 'admin']
        );
        expect(result).toEqual(mockResult);
      });

      it('should create a user without role successfully', async () => {
        // Arrange
        const mockResult = { insertId: 1 };
        mockPromiseQuery.mockResolvedValue([mockResult, []]);

        // Act
        const result = await userModel.create('newuser', 'password123');

        // Assert
        expect(mockPromiseQuery).toHaveBeenCalledWith(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          ['newuser', 'hashed_password123']
        );
        expect(result).toEqual(mockResult);
      });
    });

    describe('findByUsername', () => {
      it('should find user by username successfully', async () => {
        // Arrange
        const mockUser = {
          id: 1,
          username: 'testuser',
          password: 'hashedpassword',
          role: 'admin'
        };
        mockPromiseQuery.mockResolvedValue([[mockUser], []]);

        // Act
        const result = await userModel.findByUsername('testuser');

        // Assert
        expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?', ['testuser']);
        expect(result).toEqual(mockUser);
      });

      it('should return null if user not found', async () => {
        // Arrange
        mockPromiseQuery.mockResolvedValue([[], []]);

        // Act
        const result = await userModel.findByUsername('nonexistent');

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('getAllUsers', () => {
      it('should get all users successfully', async () => {
        // Arrange
        const mockUsers = [
          { id: 1, username: 'user1', role: 'admin' },
          { id: 2, username: 'user2', role: 'user' }
        ];
        mockPromiseQuery.mockResolvedValue([mockUsers, []]);

        // Act
        const result = await userModel.getAllUsers();

        // Assert
        expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT * FROM users', []);
        expect(result).toEqual(mockUsers);
      });

      it('should handle single result object', async () => {
        // Arrange
        const mockUser = { id: 1, username: 'user1', role: 'admin' };
        mockPromiseQuery.mockResolvedValue([[mockUser], []]);

        // Act
        const result = await userModel.getAllUsers();

        // Assert
        expect(result).toEqual([mockUser]);
      });
    });
  });
});
