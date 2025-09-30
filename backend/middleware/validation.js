// Validation middleware for request data
const validateBooking = (req, res, next) => {
    const { name, mobile, nurseType, location, services, preferences, enquiryno } = req.body;
    
    // Check for missing required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!mobile) missingFields.push('mobile');
    if (!nurseType) missingFields.push('nurseType');
    if (!location) missingFields.push('location');
    if (!services) missingFields.push('services');
    if (!preferences) missingFields.push('preferences');
    if (!enquiryno) missingFields.push('enquiryno');
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: `Missing required fields: ${missingFields.join(', ')}`
        });
    }
    
    // Check for empty required fields
    const emptyFields = [];
    if (name.trim() === '') emptyFields.push('name');
    if (mobile.trim() === '') emptyFields.push('mobile');
    if (nurseType.trim() === '') emptyFields.push('nurseType');
    if (location.trim() === '') emptyFields.push('location');
    if (services.trim() === '') emptyFields.push('services');
    if (preferences.trim() === '') emptyFields.push('preferences');
    if (enquiryno.trim() === '') emptyFields.push('enquiryno');
    
    if (emptyFields.length > 0) {
        return res.status(400).json({
            error: 'Required fields cannot be empty'
        });
    }
    
    // Basic mobile validation (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({
            error: 'Invalid mobile number format'
        });
    }
    
    // Valid nurse types
    const validNurseTypes = ['Registered Nurse', 'Licensed Practical Nurse', 'Certified Nursing Assistant', 'Specialized Nurse'];
    if (!validNurseTypes.includes(nurseType)) {
        return res.status(400).json({
            error: 'Invalid nurse type'
        });
    }
    
    next();
};

const validateRegistration = (req, res, next) => {
    const { name, mobile, email, gender, dob, education, experience, languages, specialization, address, base_location, serviceopt } = req.body;
    
    // Check for missing required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!mobile) missingFields.push('mobile');
    if (!email) missingFields.push('email');
    if (!gender) missingFields.push('gender');
    if (!dob) missingFields.push('dob');
    if (!education) missingFields.push('education');
    if (!experience) missingFields.push('experience');
    if (!languages) missingFields.push('languages');
    if (!specialization) missingFields.push('specialization');
    if (!address) missingFields.push('address');
    if (!base_location) missingFields.push('base_location');
    if (!serviceopt) missingFields.push('serviceopt');
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: `Missing required fields: ${missingFields.join(', ')}`
        });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: 'Invalid email format'
        });
    }
    
    // Gender validation
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(gender)) {
        return res.status(400).json({
            error: 'Invalid gender'
        });
    }
    
    // Date of birth validation
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
        return res.status(400).json({
            error: 'Invalid date of birth format'
        });
    }
    
    // Check if date is in future
    if (dobDate > new Date()) {
        return res.status(400).json({
            error: 'Date of birth cannot be in the future'
        });
    }
    
    // Languages validation (should be array)
    if (!Array.isArray(languages) || languages.length === 0) {
        return res.status(400).json({
            error: 'At least one language must be specified'
        });
    }
    
    // Service options validation (should be array)
    if (!Array.isArray(serviceopt) || serviceopt.length === 0) {
        return res.status(400).json({
            error: 'At least one service option must be specified'
        });
    }
    
    next();
};

const validateUser = (req, res, next) => {
    const { username, password, role } = req.body;
    
    // Check for missing required fields
    const missingFields = [];
    if (!username) missingFields.push('username');
    if (!password) missingFields.push('password');
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: `Missing required fields: ${missingFields.join(', ')}`
        });
    }
    
    // Check for empty fields
    if (username.trim() === '' || password.trim() === '') {
        return res.status(400).json({
            error: 'Required fields cannot be empty'
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({
            error: 'Password must be at least 6 characters long'
        });
    }
    
    // Role validation (if provided)
    if (role) {
        const validRoles = ['admin', 'user', 'manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: 'Invalid role'
            });
        }
    }
    
    // Username validation (alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            error: 'Username can only contain letters, numbers, and underscores'
        });
    }
    
    next();
};

module.exports = {
    validateBooking,
    validateRegistration,
    validateUser
};
