const Record = require('../models/Record');

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
// @access  Private (Admin, Analyst)
const getSummary = async (req, res) => {
    try {
        // Fetch all records and sort them by date (newest first)
        const records = await Record.find().sort({ date: -1 }).populate('user', 'name');

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryMap = {};
        const monthlyMap = {};
        const recentActivity = [];

        // Iterate over the records to calculate our data explicitly
        for (let record of records) {
            // -- Totals --
            if (record.type === 'income') {
                totalIncome += record.amount;
            } else if (record.type === 'expense') {
                totalExpense += record.amount;
            }

            // -- Category Totals --
            let cat = record.category;
            if (!cat) {
                cat = 'Uncategorized';
            }

            if (!categoryMap[cat]) {
                categoryMap[cat] = { income: 0, expense: 0 };
            }

            if (record.type === 'income') {
                categoryMap[cat].income += record.amount;
            } else {
                categoryMap[cat].expense += record.amount;
            }

            // -- Monthly Trends --
            const date = new Date(record.date);
            // Format: YYYY-MM
            const monthNumber = date.getMonth() + 1;
            const paddedMonth = monthNumber < 10 ? '0' + monthNumber : monthNumber.toString();
            const key = date.getFullYear() + '-' + paddedMonth;

            if (!monthlyMap[key]) {
                monthlyMap[key] = { month: key, income: 0, expense: 0 };
            }

            if (record.type === 'income') {
                monthlyMap[key].income += record.amount;
            } else {
                monthlyMap[key].expense += record.amount;
            }

            // // -- Recent Activity --
            // recentActivity.push({
            //     _id: record._id,
            //     title: record.title,
            //     amount: record.amount,
            //     type: record.type,
            //     category: record.category,
            //     date: record.date,
            //     user: record.user
            // });
        }

        const balance = totalIncome - totalExpense;

        // Format the maps back into arrays for the frontend
        const categoryTotals = [];
        for (let categoryName in categoryMap) {
            const vals = categoryMap[categoryName];
            // console.log(vals);
            categoryTotals.push({
                name: categoryName,
                income: vals.income,
                expense: vals.expense,
                net: vals.income - vals.expense
            });
        }

        const monthlyTrends = [];
        for (let monthKey in monthlyMap) {
            monthlyTrends.push(monthlyMap[monthKey]);
        }
        // Ensure chronological sorting
        monthlyTrends.sort((a, b) => a.month.localeCompare(b.month));

        // 200 OK - Return structured analytics data
        res.status(200).json({
            totalIncome,
            totalExpense,
            balance,
            categoryTotals,
            monthlyTrends,
            recentActivity
        });
    } catch (error) {
        // 500 Internal Server Error
        console.log(error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};

module.exports = {
    getSummary
};
