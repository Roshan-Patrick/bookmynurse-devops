const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bookingDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Booking Schema
const bookingSchema = new mongoose.Schema({
    day: String,
    time: String,
    patientName: String,
});

const Booking = mongoose.model('Booking', bookingSchema);

// API Endpoint to book a slot
app.post('/book', (req, res) => {
    const { day, time, patientName } = req.body;

    const newBooking = new Booking({
        day,
        time,
        patientName,
    });

    newBooking.save()
        .then(() => res.status(201).send('Booking created'))
        .catch(err => res.status(500).send('Error booking slot: ' + err));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
