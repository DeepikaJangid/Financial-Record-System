const Record = require('../models/Record');

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
// @access  Private (Admin, Analyst)
const getSummary = async (req, res) => {
    try {
        const records = await Record.find().sort({ date: -1 }).populate('user', 'name');

        // --- Totals ---
        const totalIncome = records
            .filter(r => r.type === 'income')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const totalExpense = records
            .filter(r => r.type === 'expense')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const balance = totalIncome - totalExpense;

        // --- Category Totals ---
        const categoryMap = {};
        records.forEach(r => {
            const cat = r.category || 'Uncategorized';
            if (!categoryMap[cat]) {
                categoryMap[cat] = { income: 0, expense: 0 };
            }
            if (r.type === 'income') {
                categoryMap[cat].income += r.amount;
            } else {
                categoryMap[cat].expense += r.amount;
            }
        });
        const categoryTotals = Object.entries(categoryMap).map(([name, vals]) => ({
            name,
            income: vals.income,
            expense: vals.expense,
            net: vals.income - vals.expense
        }));

        // --- Monthly Trends ---
        const monthlyMap = {};
        records.forEach(r => {
            const date = new Date(r.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyMap[key]) {
                monthlyMap[key] = { month: key, income: 0, expense: 0 };
            }
            if (r.type === 'income') {
                monthlyMap[key].income += r.amount;
            } else {
                monthlyMap[key].expense += r.amount;
            }
        });
        const monthlyTrends = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

        // --- Recent Activity (all records, sorted newest first — client paginates) ---
        const recentActivity = records.map(r => ({
            _id: r._id,
            title: r.title,
            amount: r.amount,
            type: r.type,
            category: r.category,
            date: r.date,
            user: r.user
        }));

        res.status(200).json({
            totalIncome,
            totalExpense,
            balance,
            categoryTotals,
            monthlyTrends,
            recentActivity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};

module.exports = {
    getSummary
};
