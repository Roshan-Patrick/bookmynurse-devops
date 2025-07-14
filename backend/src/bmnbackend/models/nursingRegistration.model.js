const { pool, query } = require('../config/db');

const nursingRegistrationModel = {
  insertImg: async (filePath) => {
    try {
      const result = await query('INSERT INTO images (file_path) VALUES (?)', [filePath]);
      return result.insertId;
    } catch (err) {
      console.error('Error inserting image:', err);
      throw err;
    }
  },

  insertRegistration: async (data) => {
    try {
      const { name, mobile, email, gender, dob, education, experience, languages,
        specialization, address, base_location, serviceopt, imageId } = data;

      const result = await query(
        `INSERT INTO registration (name, mobile, email, gender, dob, education, experience, languages, specialization,
            address, base_location, serviceopt, image_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, mobile, email, gender, dob, education, experience, languages,
          specialization, address, base_location, serviceopt, imageId]
      );
      return result.insertId;
    } catch (err) {
      console.error('Error inserting registration:', err);
      throw err;
    }
  },

  updateApprovalStatus: async (id, status) => {
    try {
      const result = await query('UPDATE registration SET approval_status = ? WHERE id = ?', [status, id]);
      return result;
    } catch (err) {
      console.error('Error updating approval status:', err);
      throw err;
    }
  },

  updateAvailableStatus: async (id, status) => {
    try {
      const result = await query('UPDATE registration SET availability = ? WHERE id = ?', [status, id]);
      return result;
    } catch (err) {
      console.error('Error updating availability status:', err);
      throw err;
    }
  },

  revertApprovalStatus: async (id) => {
    try {
      const result = await query('UPDATE registration SET approval_status = "Pending" WHERE id = ?', [id]);
      return result;
    } catch (err) {
      console.error('Error reverting approval status:', err);
      throw err;
    }
  },

  updateNurse: async (id, updatedData) => {
    try {
      const {
        name, mobile, email, gender, dob, education, experience,
        languages, specialization, address, base_location, serviceopt
      } = updatedData;

      const sql = `
        UPDATE registration 
        SET name = ?, mobile = ?, email = ?, gender = ?, dob = ?, education = ?, 
            experience = ?, languages = ?, specialization = ?, address = ?, base_location = ?, serviceopt = ?
        WHERE id = ?`;

      const values = [
        name, mobile, email, gender, dob, education, experience,
        languages, specialization, address, base_location, serviceopt, id
      ];

      const result = await query(sql, values);
      return result;
    } catch (err) {
      console.error("Error updating registration:", err);
      throw err;
    }
  },

  getAllRegistrations: async (approvalStatus) => {
    try {
      let sql = `
        SELECT r.*, 
        JSON_UNQUOTE(r.languages) AS languages, 
        JSON_UNQUOTE(r.serviceopt) AS serviceopt, 
        i.file_path 
        FROM registration r 
        JOIN images i ON r.image_id = i.id
      `;
      let params = [];

      if (approvalStatus) {
        sql += " WHERE r.approval_status = ?";
        params.push(approvalStatus);
      }

      const results = await query(sql, params);
      // console.log('Raw query results:', JSON.stringify(results, null, 2));

      // If results is a single object, wrap it in an array
      if (!Array.isArray(results)) {
        console.log('Converting single result to array');
        return [{
          ...results,
          languages: results.languages ? JSON.parse(results.languages) : [],
          serviceopt: results.serviceopt ? JSON.parse(results.serviceopt) : []
        }];
      }

      return results.map(row => ({
        ...row,
        languages: row.languages ? JSON.parse(row.languages) : [],
        serviceopt: row.serviceopt ? JSON.parse(row.serviceopt) : []
      }));
    } catch (err) {
      console.error('Error fetching registrations:', err);
      throw err;
    }
  },

  updateCharges: async (id, charges, charges_type) => {
    try {
      const result = await query("UPDATE registration SET charges = ?, charges_type = ? WHERE id = ?", 
        [charges, charges_type, id]);
      return result;
    } catch (err) {
      console.error("Error updating charges:", err);
      throw err;
    }
  },

  updateNurseId: async (bookingId, nurseId) => {
    try {
      const result = await query('UPDATE bookings SET nurse_id = ? WHERE id = ?', [nurseId, bookingId]);
      return result;
    } catch (err) {
      console.error("Error updating nurse_id:", err);
      throw err;
    }
  },

  fetchNurseDetails: async (bookingId) => {
    try {
      const results = await query(`
        SELECT r.* 
        FROM bookings b 
        INNER JOIN registration r ON b.nurse_id = r.id 
        WHERE b.id = ?
      `, [bookingId]);
      
      if (!Array.isArray(results) || results.length === 0) {
        console.log('No nurse details found for booking:', bookingId);
        return null;
      }
      
      return results[0];
    } catch (err) {
      console.error("Error fetching nurse details:", err);
      throw err;
    }
  }
};

module.exports = nursingRegistrationModel;