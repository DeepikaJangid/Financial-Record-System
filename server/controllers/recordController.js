const mongoose = require('mongoose');
const Record = require('../models/Record');

// Helper: validate MongoDB ObjectId format to prevent CastError crashes
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all financial records (with optional filters)
// @route   GET /api/records
// @access  Private (Admin=0, Analyst=1, Viewer=2)
const getRecords = async (req, res) => {
    try {
        const { type, category, startDate, endDate } = req.query;

        // 400 Bad Request — invalid type filter
        if (type && !['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type filter. Use income or expense.' });
        }

        let query = {};
        if (type) query.type = type;
        if (category) query.category = { $regex: category, $options: 'i' }; // case-insensitive match
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start)) return res.status(400).json({ message: 'Invalid startDate format.' });
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end)) return res.status(400).json({ message: 'Invalid endDate format.' });
                query.date.$lte = end;
            }
        }

        // 200 OK — records retrieved successfully
        const records = await Record.find(query).sort({ date: -1 }).populate('user', 'name email');
        res.status(200).json(records);
    } catch (error) {
        console.error(error);
        // 500 Internal Server Error — unexpected failure
        res.status(500).json({ message: 'Server error fetching records' });
    }
};

// @desc    Get a single financial record by ID
// @route   GET /api/records/:id
// @access  Private (Admin=0, Analyst=1, Viewer=2)
const getRecordById = async (req, res) => {
    try {
        // 400 Bad Request — malformed ID
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid record ID format.' });
        }

        const record = await Record.findById(req.params.id).populate('user', 'name email');

        // 404 Not Found — record does not exist
        if (!record) {
            return res.status(404).json({ message: 'Record not found.' });
        }

        // 200 OK — record found
        res.status(200).json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching record' });
    }
};

// @desc    Create new financial record
// @route   POST /api/records
// @access  Private (Admin=0, Analyst=1)
const createRecord = async (req, res) => {
    try {
        const { title, amount, type, category, date, notes } = req.body;

        // 400 Bad Request — missing required fields
        if (!title || amount === undefined || !type || !category) {
            return res.status(400).json({ message: 'title, amount, type and category are all required.' });
        }

        // 400 Bad Request — invalid type value
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'type must be either income or expense.' });
        }

        // 400 Bad Request — amount must be a positive number
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'amount must be a positive number.' });
        }

        // 400 Bad Request — title exceeds reasonable length
        if (title.trim().length < 2) {
            return res.status(400).json({ message: 'title must be at least 2 characters.' });
        }

        let parsedDate = date ? new Date(date) : new Date();
        if (isNaN(parsedDate)) {
            return res.status(400).json({ message: 'Invalid date format.' });
        }

        // 201 Created — record successfully created
        const record = await Record.create({
            title: title.trim(),
            amount,
            type,
            category: category.trim(),
            date: parsedDate,
            notes: notes ? notes.trim() : '',
            user: req.user.id
        });

        res.status(201).json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating record' });
    }
};

// @desc    Update financial record
// @route   PUT /api/records/:id
// @access  Private (Admin=0 only)
const updateRecord = async (req, res) => {
    try {
        // 400 Bad Request — malformed ID
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid record ID format.' });
        }

        const record = await Record.findById(req.params.id);

        // 404 Not Found — record does not exist
        if (!record) {
            return res.status(404).json({ message: 'Record not found.' });
        }

        const { title, amount, type, category, date, notes } = req.body;

        // 400 Bad Request — invalid type
        if (type && !['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'type must be either income or expense.' });
        }

        // 400 Bad Request — invalid amount
        if (amount !== undefined && (typeof amount !== 'number' || isNaN(amount) || amount <= 0)) {
            return res.status(400).json({ message: 'amount must be a positive number.' });
        }

        // 400 Bad Request — title too short
        if (title !== undefined && title.trim().length < 2) {
            return res.status(400).json({ message: 'title must be at least 2 characters.' });
        }

        let parsedDate;
        if (date) {
            parsedDate = new Date(date);
            if (isNaN(parsedDate)) return res.status(400).json({ message: 'Invalid date format.' });
        }

        // 200 OK — record updated
        const updatedRecord = await Record.findByIdAndUpdate(
            req.params.id,
            {
                ...(title && { title: title.trim() }),
                ...(amount !== undefined && { amount }),
                ...(type && { type }),
                ...(category && { category: category.trim() }),
                ...(parsedDate && { date: parsedDate }),
                ...(notes !== undefined && { notes: notes.trim() }),
            },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating record' });
    }
};

// @desc    Delete financial record
// @route   DELETE /api/records/:id
// @access  Private (Admin=0 only)
const deleteRecord = async (req, res) => {
    try {
        // 400 Bad Request — malformed ID
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid record ID format.' });
        }

        const record = await Record.findById(req.params.id);

        // 404 Not Found — record does not exist
        if (!record) {
            return res.status(404).json({ message: 'Record not found.' });
        }

        await record.deleteOne();

        // 200 OK — record deleted
        res.status(200).json({ message: 'Record deleted successfully.', id: req.params.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting record' });
    }
};

// @desc    Get all distinct categories
// @route   GET /api/records/categories
// @access  Private (Admin=0, Analyst=1, Viewer=2)
const getCategories = async (req, res) => {
    try {
        const categories = await Record.distinct('category');
        // 200 OK — sorted unique categories
        res.status(200).json(categories.sort());
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

module.exports = {
    getRecords,
    getRecordById,
    createRecord,
    updateRecord,
    deleteRecord,
    getCategories,
};
