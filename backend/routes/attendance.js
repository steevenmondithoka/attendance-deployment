const express = require('express');
const { markAttendance, getClassAttendance, getStudentAttendanceHistory } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { isTeacher } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/mark', protect, isTeacher, markAttendance);
router.get('/class/:id', protect, getClassAttendance);
router.get('/student/:id', protect, getStudentAttendanceHistory);

module.exports = router;