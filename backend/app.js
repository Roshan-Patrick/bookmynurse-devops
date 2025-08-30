const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const clientauthRoutes = require('./routes/clientauth');
const nurseRoutes = require('./routes/nursing.routes')
const registrationRoutes  = require('./routes/registration.routes');
const path = require('path');
const cors = require('cors');
const setupSwagger = require('./swagger');
const v8 = require("v8");
const util = require("util");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/nursing', nurseRoutes);
// Use the registration routes
app.use('/api/register', registrationRoutes);
app.use('/api/clientauth',clientauthRoutes)

// Serve uploaded files as static                                            │     
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve uploaded files based on environment
const uploadsPath = process.env.NODE_ENV === 'production' 
    ? '/app/uploads' 
    : path.join(__dirname, 'uploads');

app.use('/api/uploads', express.static(uploadsPath));

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
 });


setupSwagger(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0',() => {
    console.log(`Server running on port ${PORT}`);
});
// app.listen(3000,'103.91.186.102', () => {
//     console.log(`Server running on port ${PORT}`);
// });

// util.log(v8.getHeapStatistics());