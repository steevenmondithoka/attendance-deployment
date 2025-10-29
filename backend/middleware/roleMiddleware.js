exports.isTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ success: false, msg: 'User role teacher is required' });
    }
    next();
};

exports.isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ success: false, msg: 'User role student is required' });
    }
    next();
};