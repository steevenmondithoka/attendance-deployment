// middleware/adminMiddleware.js
exports.isAdmin = (req, res, next) => {
    // This middleware should run AFTER the 'protect' middleware
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed to the next function
    } else {
        res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }
};