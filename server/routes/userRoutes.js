const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, updateUserStatus } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

// All user routes are protected
router.use(protect);

// GET all users — SuperAdmin (100)
router.route('/')
    .get(checkRole([100]), getAllUsers);

// Only SuperAdmin (100) can change roles
router.route('/:id/role')
    .patch(checkRole([100]), updateUserRole);

// SuperAdmin (100) can toggle status
router.route('/:id/status')
    .patch(checkRole([100]), updateUserStatus);

module.exports = router;
