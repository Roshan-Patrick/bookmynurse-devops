const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const nursingController = require('../controllers/nursingRegistration.controller');

// Endpoint for user registration (with file upload)
/**
 * @swagger
 * /register/registerNurse:
 *   post:
 *     summary: Register a nurse with an image file
 *     tags:
 *       - Nurse Registration
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string

 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *               gender:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               education:
 *                 type: string
 *               experience:
 *                 type: string
 *               languages:
 *                 type: string
 *               specialization:
 *                 type: string
 *               address:
 *                 type: string
 *               base_location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nurse registered successfully
 *       400:
 *         description: Invalid input or file missing
 *       500:
 *         description: Server error
 */
router.post('/registerNurse', upload.single('photo'), nursingController.registerNurse);

/**
 * @swagger
 * /register/registrations:
 *   get:
 *     summary: Get all nurse registrations
 *     tags:
 *       - Nurse Registration
 *     responses:
 *       200:
 *         description: List of nurse registrations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   mobile:
 *                     type: string
 *                   email:
 *                     type: string
 *                   file_path:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/registrations', nursingController.fetchAllRegistrationsNurse);


/**
 * @swagger
 * /register/updateApproval:
 *   put:
 *     summary: Update approval status (Approve/Deny)
 *     description: Updates the approval_status column in the registration table.
 *     tags:
 *       - Nurse Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The ID of the registration.
 *               status:
 *                 type: string
 *                 enum: [Approved, Denied]
 *                 description: The new approval status.
 *     responses:
 *       200:
 *         description: Approval status updated successfully.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */
router.put('/updateApproval', nursingController.updateApprovalStatus);


/**
 * @swagger
 * /register/updateAvailable:
 *   put:
 *     summary: Update Available status (Approve/Deny)
 *     description: Updates the availability column in the registration table.
 *     tags:
 *       - Nurse Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The ID of the registration.
 *               status:
 *                 type: string
 *                 enum: [Approved, Denied]
 *                 description: The new approval status.
 *     responses:
 *       200:
 *         description: Approval status updated successfully.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */
router.put('/updateAvailable', nursingController.updateAvailableStatus);

/**
 * @swagger
 * /register/revertApproval:
 *   put:
 *     summary: Revert approval status to Pending
 *     description: Updates the approval_status column back to 'Pending'.
 *     tags:
 *       - Nurse Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The ID of the registration.
 *     responses:
 *       200:
 *         description: Approval status reverted to pending.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */
router.put('/revertApproval', nursingController.revertApprovalStatus);

router.put("/editNurse/:id", nursingController.editNurse);

router.patch('/:id/charges', nursingController.updateCharges);

router.patch('/update-nurse', nursingController.updateNurseId);

router.get('/nurse-details/:id', nursingController.getNurseDetailsFromBooking);




module.exports = router;