// Validation middleware for request data
const validateBooking = (req, res, next) => {
    const { name, mobile, email, address, service_required, date, time } = req.body;
    
    if (!name || !mobile || !email || !address || !service_required || !date || !time) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }
    
    // Basic mobile validation (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid mobile number format'
        });
    }
    
    next();
};

const validateRegistration = (req, res, next) => {
    const { name, mobile, email, address, specialization, experience, education } = req.body;
    
    if (!name || !mobile || !email || !address || !specialization || !experience || !education) {
        return res.status(400).json({
            success: false,
            message: 'All required fields must be provided'
        });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }
    
    // Basic mobile validation (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid mobile number format'
        });
    }
    
    next();
};

const validateUser = (req, res, next) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }
    
    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Username must be at least 3 characters long'
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
        });
    }
    
    next();
};

module.exports = {
    validateBooking,
    validateRegistration,
    validateUser
};
