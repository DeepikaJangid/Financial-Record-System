const express = require('express');
const router = express.Router();
const { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, getCategories } = require('../controllers/recordController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

// Apply auth middleware to all routes
router.use(protect);

// 200 — get all records (with optional filters) | 201 — create new record
router.route('/')
    .get(checkRole([100, 0, 1, 2]), getRecords)    // All roles can view
    .post(checkRole([100, 0, 1]), createRecord);    // SuperAdmin, Admin, Analyst can create

// 200 — get distinct categories for filter dropdowns
router.get('/categories', checkRole([100, 0, 1, 2]), getCategories);

// 200 — get one | 200 — update | 200 — delete
router.route('/:id')
    .get(checkRole([100, 0, 1, 2]), getRecordById) // All roles can view single record
    .put(checkRole([100, 0]), updateRecord)         // SuperAdmin, Admin only
    .delete(checkRole([100, 0]), deleteRecord);     // SuperAdmin, Admin only

module.exports = router;
