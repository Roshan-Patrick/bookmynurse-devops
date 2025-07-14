const express = require('express');
const router = express.Router();
const nursingController = require('../controllers/nursing.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/nursing/bookings:
 *   post:
 *     summary: Register a nurse booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mobile:
 *                 type: string
 *               nurseType:
 *                 type: string
 *               location:
 *                 type: string
 *               services:
 *                 type: string
 *               preferences:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       500:
 *         description: Internal Server Error
 */
router.post('/bookings', nursingController.nurseRegController);

/**
 * @swagger
 * /api/nursing/getBookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Booking]
 *     responses:
 *       200:
 *         description: Successfully retrieved bookings
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
 *                   nurseType:
 *                     type: string
 *                   location:
 *                     type: string
 *                   services:
 *                     type: string
 *                   preferences:
 *                     type: string
 *       500:
 *         description: Internal Server Error
 */
router.get('/getBookings', nursingController.getAllBookings);

/**
 * @swagger
 * /api/nursing/updateBooking:
 *   put:
 *     summary: Update a booking
 *     tags: [Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               enquiryno:
 *                 type: string
 *               name:
 *                 type: string
 *               mobile:
 *                 type: string
 *               nurseType:
 *                 type: string
 *               location:
 *                 type: string
 *               services:
 *                 type: string
 *               preferences:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated the booking
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal Server Error
 */
router.put('/updateBooking', nursingController.updateBooking);

/**
 * @swagger
 * /api/nursing/deleteBookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Booking]
 *     description: Deletes a booking entry from the database by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the booking to delete
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/deleteBookings/:id', nursingController.deleteBooking);

router.put('/updateNurseApproval', nursingController.updateNurseApprovalStatus);


module.exports = router;