require("dotenv").config();

const Regis = require('../models/nursingRegistration.model');
const nodemailer = require("nodemailer");

// Create transporter only if SMTP configuration is available
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // Use TLS instead of SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Prevent SSL certificate issues
    },
  });
}


// Handle user registration
const nursingController = {
  registerNurse: async (req, res) => {
    try {
      const {
        name, mobile, email, gender, dob, education, experience,
        languages, specialization, address, base_location, serviceopt } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
      }

      console.log('Received Data:', req.body);
      console.log('Uploaded File:', req.file);
      // Convert languages from JSON string to array
      const parsedLanguages = languages ? JSON.parse(languages) : [];
      const parsedServiceopt = serviceopt ? JSON.parse(serviceopt) : [];

      // Save file path to the images table
      const imageId = await Regis.insertImg(req.file.path);

      // Save registration details with the image ID
      const registrationData = {
        name, mobile, email, gender, dob, education, experience,
        languages: JSON.stringify(parsedLanguages), // Store as JSON string
        specialization, address, base_location, imageId, serviceopt: JSON.stringify(parsedServiceopt)
      };

      const registrationId = await Regis.insertRegistration(registrationData);

      // Try to send email, but don't let it affect the registration process
      if (transporter) {
        try {
          const mailOptions = {
            from: process.env.SMTP_FROM || '"ResQ Consultants" <noreply@bookmynurse.com>',
            to: email,
            subject: "Nurse Registration Acknowledgment - BookMyNurse",
            html: `<p>Dear Sir/Madam,</p>
                   <p><b>Greetings from BookMyNurse.Com</b></p>
                   <p>Thanks for registering with <b>BookMyNurse.Com</b>. Our operations team will get back to you shortly for verification.</p>
                   <p>In the meantime, please download our <b>BookMyNurse</b> mobile app to stay connected with us.</p>
                   <p><b>URL:</b> <a href="https://drive.google.com/file/d/1jnbBn6TMOeyZ2WScG5Ikg3Dm84mretrk/view?usp=sharing" target="_blank">Download App</a></p>
                   <p><b>QR Code:</b></p>
                   <p><img src="cid:qrcode" alt="QR Code" style="width:150px; height:150px;"></p>
                   <p>Regards,</p>
                   <p><b>Team BookMyNurse.Com</b></p>`,
            headers: {
              "X-Priority": "1 (Highest)",
              "X-MSMail-Priority": "High",
              Importance: "High",
            },
            attachments: [
              {
                filename: 'bmn-app-qr.png',
                path: 'assets/img/bmn-app-qr.png',
                cid: 'qrcode' // This CID is used in the email body
              }
            ]
          };

          await transporter.sendMail(mailOptions);
          console.log("Acknowledgment Email Sent");
        } catch (emailError) {
          // Log the email error but don't fail the registration
          console.error('Failed to send registration email:', emailError);
          // Continue with the registration process
        }
      } else {
        console.log('SMTP not configured, skipping email notification');
      }

      res.status(201).json({ 
        success: true, 
        registrationId,
        message: 'Registration successful. Please check your email for confirmation.'
      });
    } catch (err) {
      console.error('Error in registerNurse:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error processing registration',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },



  // Get all registrations for admin dashboard
  fetchAllRegistrationsNurse: async (req, res) => {
    try {
      const approvalStatus = req.query.approval_status || null;
      const registrations = await Regis.getAllRegistrations(approvalStatus);
      res.status(200).json({ success: true, data: registrations });
    } catch (err) {
      console.error('Error in fetchAllRegistrationsNurse:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching registrations',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  updateApprovalStatus: async (req, res) => {
    try {
      const { id, status } = req.body;

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid approval status' });
      }

      const result = await Regis.updateApprovalStatus(id, status);
      res.status(200).json({ success: true, message: `Registration ${status} successfully` });
    } catch (err) {
      console.error('Error in updateApprovalStatus:', err);
      res.status(500).json({ success: false, message: 'Error updating approval status' });
    }
  },

  updateAvailableStatus: async (req, res) => {
    try {
      const { id, status } = req.body;

      if (!['Available', 'Unavailable'].includes(status)) {
        return res.status(400).json({ error: 'Invalid availability status' });
      }

      const result = await Regis.updateAvailableStatus(id, status);
      res.status(200).json({ success: true, message: `Availability status updated to ${status}` });
    } catch (err) {
      console.error('Error in updateAvailableStatus:', err);
      res.status(500).json({ success: false, message: 'Error updating availability status' });
    }
  },

  revertApprovalStatus: async (req, res) => {
    try {
      const { id } = req.body;
      const result = await Regis.revertApprovalStatus(id);
      res.status(200).json({ success: true, message: 'Approval status reverted to pending' });
    } catch (err) {
      console.error('Error in revertApprovalStatus:', err);
      res.status(500).json({ success: false, message: 'Error reverting approval status' });
    }
  },

  editNurse: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name, aadhaar, mobile, email, gender, dob, education, experience,
        languages, specialization, address, base_location, serviceopt
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Nurse ID is required for updating." });
      }

      const parsedLanguages = Array.isArray(languages) ? JSON.stringify(languages) : languages;
      const parsedServiceopt = Array.isArray(serviceopt) ? JSON.stringify(serviceopt) : serviceopt;

      await Regis.updateNurse(id, {
        name, aadhaar, mobile, email, gender, dob, education, experience,
        languages: parsedLanguages, specialization, address, base_location, serviceopt: parsedServiceopt
      });

      res.status(200).json({ success: true, message: "Nurse details updated successfully!" });
    } catch (err) {
      console.error("Error updating nurse details:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  updateCharges: async (req, res) => {
    try {
      const { id } = req.params;
      const { charges, charges_type } = req.body;

      if (!charges || isNaN(charges)) {
        return res.status(400).json({ error: 'Valid charges amount required' });
      }

      await Regis.updateCharges(id, charges, charges_type);
      res.status(200).json({ success: true, message: 'Charges updated successfully' });
    } catch (err) {
      console.error("Error updating charges:", err);
      res.status(500).json({ success: false, message: 'Error updating charges' });
    }
  },

  updateNurseId: async (req, res) => {
    try {
      const { bookingId, nurseId } = req.body;
      await Regis.updateNurseId(bookingId, nurseId);
      res.status(200).json({ success: true, message: 'Nurse ID updated successfully' });
    } catch (err) {
      console.error('Error updating nurse_id:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getNurseDetailsFromBooking: async (req, res) => {
    try {
      const bookingId = req.params.id;
      const nurse = await Regis.fetchNurseDetails(bookingId);
      res.status(200).json({ success: true, nurse });
    } catch (err) {
      console.error('Error fetching nurse details:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// Export all controller functions as a single object
module.exports = nursingController;
