const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        // Extract user input data
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        const role = req.body.role;

        // Basic validation
        if (!name || !email || !password) {
            // 400 Bad Request
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: email });

        if (userExists) {
            // 400 Bad Request
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Assign role (prevent direct SuperAdmin registration)
        let assignedRole = 2; // Default to Viewer
        if (role !== undefined && role !== 100) {
            assignedRole = role;
        }

        // Create the user in the database
        const user = await User.create({
            name: name,
            email: email,
            password: hashedPassword,
            role: assignedRole
        });

        if (user) {
            // 201 Created - Return the user and their token
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            // 400 Bad Request
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        // 500 Internal Server Error
        console.log(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        // Extract credentials
        const email = req.body.email;
        const password = req.body.password;

        // Check database for user email
        const user = await User.findOne({ email: email });

        if (!user) {
            // 401 Unauthorized
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare submitted password with stored hash
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (isPasswordMatch) {
            // 200 OK - Return the user along with a token to keep them logged in
            res.status(200).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            // 401 Unauthorized
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        // 500 Internal Server Error
        console.log(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
