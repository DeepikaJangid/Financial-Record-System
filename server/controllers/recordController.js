const mongoose = require('mongoose');
const Record = require('../models/Record');

// Helper: validate MongoDB ObjectId format to prevent CastError crashes
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all financial records (with optional filters)
// @route   GET /api/records
// @access  Private (Admin=0, Analyst=1, Viewer=2)
const getRecords = async (req, res) => {
    const query = req.query;
    const filterQuery = {};

    // Build the filterQuery object dynamically based on what the user sent
    if (query.type) {
        filterQuery.type = query.type;
    }

    if (query.category) {
        // Use regex for partial, case-insensitive match
        filterQuery.category = { $regex: query.category, $options: 'i' };
    }

    if (query.startDate) {
        // Initialize date object if it doesn't exist
        if (!filterQuery.date) {
            filterQuery.date = {};
        }
        filterQuery.date.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
        // Initialize date object if it doesn't exist
        if (!filterQuery.date) {
            filterQuery.date = {};
        }
        filterQuery.date.$lte = new Date(query.endDate);
    }

    try {
        // Fetch the records from the database using our filterQuery
        const records = await Record.find(filterQuery)
            .sort({ date: -1 })
            .populate('user', 'name email');

        // 200 OK - Everything went well and we are returning the data
        res.status(200).json(records);
    } catch (error) {
        // 500 Internal Server Error - Something went wrong on the server side
        console.log(error);
        res.status(500).json({ message: 'Server error fetching records' });
    }
};

// @desc    Get a single financial record by ID
// @route   GET /api/records/:id
// @access  Private (Admin=0, Analyst=1, Viewer=2)
const getRecordById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            // 400 Bad Request - The ID format is not valid
            return res.status(400).json({ message: 'Invalid record ID format.' });
        }

        const record = await Record.findById(req.params.id).populate('user', 'name email');

        if (!record) {
            // 404 Not Found - Record could not be found in the database
            return res.status(404).json({ message: 'Record not found.' });
        }

        // 200 OK - Record found
        res.status(200).json(record);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error fetching record' });
    }
};

// @desc    Create new financial record
// @route   POST /api/records
// @access  Private (Admin=0, Analyst=1)
const createRecord = async (req, res) => {
    try {
        // Extract data from the incoming request body
        const title = req.body.title;
        const amount = req.body.amount;
        const type = req.body.type;
        const category = req.body.category;
        const date = req.body.date;
        const notes = req.body.notes;

        // Basic Validation
        if (!title || !amount || !type || !category) {
            // 400 Bad Request - The user forgot to send required fields
            return res.status(400).json({ message: 'title, amount, type and category are all required.' });
        }

        let parsedDate;
        if (date) {
            parsedDate = new Date(date);
        } else {
            parsedDate = new Date();
        }

        // Create the record in the database
        const newRecord = await Record.create({
            title: title,
            amount: Number(amount), // Ensure it is treated as a number
            type: type,
            category: category,
            date: parsedDate,
            notes: notes,
            user: req.user.id
        });

        // 201 Created - The resource was successfully created
        res.status(201).json(newRecord);
    } catch (error) {
        // 500 Internal Server Error - Something went wrong on the server side
        console.log(error);
        res.status(500).json({ message: 'Server error creating record' });
    }
};

// @desc    Update financial record
// @route   PUT /api/records/:id
// @access  Private (Admin=0 only)
const updateRecord = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            // 400 Bad Request - Missing or invalid ID
            return res.status(400).json({ message: 'Invalid record ID format.' });
        }

        const record = await Record.findById(req.params.id);

        if (!record) {
            // 404 Not Found - The record does not exist
            return res.status(404).json({ message: 'Record not found.' });
        }

        // Extract data from the request body
        const title = req.body.title;
        const amount = req.body.amount;
        const type = req.body.type;
        const category = req.body.category;
        const date = req.body.date;
        const notes = req.body.notes;

        // Update the fields only if they were provided by the user
        if (title) {
            record.title = title;
        }
        if (amount !== undefined) {
            record.amount = Number(amount);
        }
        if (type) {
            record.type = type;
        }
        if (category) {
            record.category = category;
        }
        if (date) {
            record.date = new Date(date);
        }
        if (notes !== undefined) {
            record.notes = notes;
        }

        // Save the updated record to the database
        const updatedRecord = await record.save();

        // 200 OK - Request succeeded
        res.status(200).json(updatedRecord);
    } catch (error) {
        // 500 Internal Server Error
        console.log(error);
        res.status(500).json({ message: 'Server error updating record' });
    }
};

// @desc    Delete financial record
// @route   DELETE /api/records/:id
// @access  Private (Admin=0 only)
const deleteRecord = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            // 400 Bad Request - Invalid ID formatting
            return res.status(400).json({ message: 'Invalid record ID format.' });
        }

        const record = await Record.findById(req.params.id);

        if (!record) {
            // 404 Not Found
            return res.status(404).json({ message: 'Record not found.' });
        }

        // Proceed to delete
        await record.deleteOne();

        // 200 OK - Successful deletion
        res.status(200).json({ message: 'Record deleted successfully.', id: req.params.id });
    } catch (error) {
        // 500 Internal Server Error
        console.log(error);
        res.status(500).json({ message: 'Server error deleting record' });
    }
};

// @desc    Get all distinct categories
// @route   GET /api/records/categories
// @access  Private (Admin=0, Analyst=1, Viewer=2)
const getCategories = async (req, res) => {
    try {
        const categories = await Record.distinct('category');
        // 200 OK - Request succeeded
        res.status(200).json(categories.sort());
    } catch (error) {
        // 500 Internal Server Error
        console.log(error);
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
