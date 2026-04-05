const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (SuperAdmin=100 only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        // 200 OK
        res.status(200).json(users);
    } catch (error) {
        // 500 Internal Server Error
        console.log(error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

// @desc    Update a user's role
// @route   PATCH /api/users/:id/role
// @access  Private (SuperAdmin=100 only)
const updateUserRole = async (req, res) => {
    try {
        // Extract data
        const role = req.body.role;

        // Validate the new role
        if (![100, 0, 1, 2].includes(role)) {
            // 400 Bad Request
            return res.status(400).json({ message: 'Invalid role. Allowed: 100 (SuperAdmin), 0 (Admin), 1 (Analyst), 2 (Viewer).' });
        }

        // Only SuperAdmin can promote/demote
        if (req.user.role !== 100) {
            // 403 Forbidden
            return res.status(403).json({ message: 'Only SuperAdmin can change user roles.' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            // 404 Not Found
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing own role
        if (String(user._id) === String(req.user._id)) {
            // 400 Bad Request
            return res.status(400).json({ message: 'You cannot change your own role.' });
        }

        // Apply the role change and save
        user.role = role;
        const updatedUser = await user.save();

        // 200 OK
        res.status(200).json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error updating user role' });
    }
};

// @desc    Update a user's status (active/inactive)
// @route   PATCH /api/users/:id/status
// @access  Private (SuperAdmin=100 only)
const updateUserStatus = async (req, res) => {
    try {
        // Extract data
        const status = req.body.status;

        // Validate status string
        if (!['active', 'inactive'].includes(status)) {
            // 400 Bad Request
            return res.status(400).json({ message: 'Invalid status. Must be active or inactive.' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            // 404 Not Found
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing own status
        if (String(user._id) === String(req.user._id)) {
            // 400 Bad Request
            return res.status(400).json({ message: 'You cannot change your own status.' });
        }

        // Apply the status change and save
        user.status = status;
        const updatedUser = await user.save();

        // 200 OK
        res.status(200).json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error updating user status' });
    }
};

module.exports = {
    getAllUsers,
    updateUserRole,
    updateUserStatus
};
