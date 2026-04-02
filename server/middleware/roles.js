// roles: 100 = SuperAdmin, 0 = Admin, 1 = Analyst, 2 = Viewer
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not loaded' });
        }

        if (roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
        }
    };
};

module.exports = { checkRole };
