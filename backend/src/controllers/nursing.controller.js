const Regis = require('../models/nursing.model');

const nursingController = {
  nurseRegController: async (req, res) => {
    try {
      const { name, mobile, nurseType, location, services, preferences, enquiryno } = req.body;
    
      const result = await Regis.createBooking(name, mobile, nurseType, location, services, preferences, enquiryno);
      res.status(201).json({
        message: 'Booking created successfully!',
        data: result
      });
    } catch (err) {
      console.error('Error creating nurse booking:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  getAllBookings: async (req, res) => {
    try {
      const approvalStatus = req.query.approval_status || null;
      const data = await Regis.getAllUsers(approvalStatus);
      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ success: false, error: 'Error fetching bookings' });
    }
  },

  updateBooking: async (req, res) => {
    try {
      const booking = req.body;
      if (!booking.id) {
        return res.status(400).json({ error: 'Booking ID is required' });
      }

      const result = await Regis.updateBooking(booking);
      res.status(200).json({ 
        message: 'Booking updated successfully', 
        data: result 
      });
    } catch (err) {
      console.error('Error updating booking:', err);
      res.status(500).json({ error: 'Failed to update booking' });
    }
  },

  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Booking ID is required' });
      }

      const result = await Regis.deleteBooking(id);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.status(200).json({ message: 'Booking deleted successfully!' });
    } catch (err) {
      console.error('Error deleting booking:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  updateNurseApprovalStatus: async (req, res) => {
    try {
      const { id, status } = req.body;

      if (!['Ongoing', 'Complete'].includes(status)) {
        return res.status(400).json({ error: 'Invalid approval status' });
      }

      const result = await Regis.updateApprovalStatus(id, status);
      res.status(200).json({ success: true, message: `Registration ${status} successfully` });
    } catch (err) {
      console.error('Error in updateNurseApprovalStatus:', err);
      res.status(500).json({ success: false, message: 'Error updating approval status' });
    }
  },
};

module.exports = nursingController;
