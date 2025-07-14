const db = require('../config/db');

const nursingModel = {
  createBooking: async (name, mobile, nurseType, location, services, preferences, enquiryno) => {
    try {
      const query = `
        INSERT INTO bookings (name, mobile, nurseType, location, services, preferences, enquiryno)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
    
      const result = await db.query(query, [name, mobile, nurseType, location, services, preferences, enquiryno]);
      console.log('Create booking result:', JSON.stringify(result, null, 2));
      
      // Check if the insert operation was successful
      if (!result || typeof result.insertId === 'undefined') {
        console.error('Unexpected database insert result:', result);
        throw new Error('Database insert did not return expected result.');
      }
      
      return result;
    } catch (err) {
      console.error('Error creating booking:', err);
      throw err;
    }
  },  

  getAllUsers: async (approvalStatus) => {
    try {
      let sql = 'SELECT * FROM bookings';
      let params = [];

      if (approvalStatus) {
        sql += ' WHERE approval_status = ?';
        params.push(approvalStatus);
      }

      const results = await db.query(sql, params);
      console.log('Raw query results:', JSON.stringify(results, null, 2));
      
      // If results is a single object, wrap it in an array
      if (!Array.isArray(results)) {
        console.log('Converting single result to array');
        return [results];
      }
      
      return results;
    } catch (err) {
      console.error('Database query error:', err);
      throw { error: 'Database query failed' };
    }
  },

  updateBooking: async (booking) => {
    try {
      const { id, enquiryno, name, mobile, nurseType, location, services, preferences } = booking;
      const query = `
        UPDATE bookings 
        SET enquiryno = ?, name = ?, mobile = ?, nurseType = ?, location = ?, services = ?, preferences = ? 
        WHERE id = ?`;
      
      const result = await db.query(query, [enquiryno, name, mobile, nurseType, location, services, preferences, id]);
      console.log('Update booking result:', JSON.stringify(result, null, 2));
      
      // Check if the update operation was successful
      if (!result || typeof result.affectedRows === 'undefined') {
        console.error('Unexpected database update result:', result);
        throw new Error('Database update did not return expected result.');
      }
      
      return result;
    } catch (err) {
      console.error('Database update error:', err);
      throw err;
    }
  },

  deleteBooking: async (id) => {
    try {
      const query = `DELETE FROM bookings WHERE id = ?`;
      const result = await db.query(query, [id]);
      console.log('Delete query result:', JSON.stringify(result, null, 2));
      
      // Check if the delete operation was successful
      if (!result || typeof result.affectedRows === 'undefined') {
        console.error('Unexpected database delete result:', result);
        throw new Error('Database delete did not return expected result.');
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting booking:', err);
      throw err;
    }
  },

  updateApprovalStatus: async (id, status) => {
    try {
      const query = `UPDATE bookings SET approval_status = ? WHERE id = ?`;
      const result = await db.query(query, [status, id]);
      console.log('Update approval status result:', JSON.stringify(result, null, 2));
      
      // Check if the update operation was successful
      if (!result || typeof result.affectedRows === 'undefined') {
        console.error('Unexpected database update result:', result);
        throw new Error('Database update did not return expected result.');
      }
      
      return result;
    } catch (err) {
      console.error('Error updating approval status:', err);
      throw err;
    }
  }
};

module.exports = nursingModel;
