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

app.use('/auth', authRoutes);
app.use('/nursing', nurseRoutes);
// Use the registration routes
app.use('/register', registrationRoutes);
app.use('/clientauth',clientauthRoutes)

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


setupSwagger(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// app.listen(3000,'103.91.186.102', () => {
//     console.log(`Server running on port ${PORT}`);
// });

// util.log(v8.getHeapStatistics());