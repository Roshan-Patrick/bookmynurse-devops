// Integration Tests for Nursing API Endpoints
const request = require('supertest');
const app = require('../app');

describe('Nursing API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Get authentication token for protected routes
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('POST /api/nursing/bookings', () => {
    it('should create a new booking successfully', async () => {
      const bookingData = {
        name: 'John Doe',
        mobile: '1234567890',
        nurseType: 'Registered Nurse',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day shift',
        enquiryno: 'ENQ001'
      };

      const response = await request(app)
        .post('/api/nursing/bookings')
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Booking created successfully!');
      expect(response.body.data).toHaveProperty('insertId');
    });

    it('should return 500 for invalid booking data', async () => {
      const invalidData = {
        name: 'John Doe'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/nursing/bookings')
        .send(invalidData);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/nursing/getBookings', () => {
    it('should get all bookings successfully', async () => {
      const response = await request(app)
        .get('/api/nursing/getBookings');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get bookings with approval status filter', async () => {
      const response = await request(app)
        .get('/api/nursing/getBookings?approval_status=Pending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/nursing/updateBooking', () => {
    it('should update a booking successfully', async () => {
      const updateData = {
        id: 1,
        enquiryno: 'ENQ002',
        name: 'John Updated',
        mobile: '1234567890',
        nurseType: 'Registered Nurse',
        location: 'New York',
        services: 'General Care',
        preferences: 'Day shift'
      };

      const response = await request(app)
        .put('/api/nursing/updateBooking')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking updated successfully');
    });

    it('should return 400 for missing booking ID', async () => {
      const updateData = {
        enquiryno: 'ENQ002',
        name: 'John Updated'
        // Missing id
      };

      const response = await request(app)
        .put('/api/nursing/updateBooking')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Booking ID is required');
    });
  });

  describe('DELETE /api/nursing/deleteBookings/:id', () => {
    it('should delete a booking successfully', async () => {
      const response = await request(app)
        .delete('/api/nursing/deleteBookings/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking deleted successfully!');
    });

    it('should return 400 for missing booking ID', async () => {
      const response = await request(app)
        .delete('/api/nursing/deleteBookings/');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/nursing/updateNurseApproval', () => {
    it('should update nurse approval status successfully', async () => {
      const updateData = {
        id: 1,
        status: 'Ongoing'
      };

      const response = await request(app)
        .put('/api/nursing/updateNurseApproval')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registration Ongoing successfully');
    });

    it('should return 400 for invalid status', async () => {
      const updateData = {
        id: 1,
        status: 'InvalidStatus'
      };

      const response = await request(app)
        .put('/api/nursing/updateNurseApproval')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid approval status');
    });
  });
});
