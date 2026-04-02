const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

router.route('/summary')
    .get(protect, checkRole([100, 0, 1]), getSummary); // SuperAdmin, Admin, Analyst

module.exports = router;
