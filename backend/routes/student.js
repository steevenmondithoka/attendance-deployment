const express = require('express');
const multer = require('multer');
const {
    addStudentToClass,
    getStudentInfo,
    bulkRegisterStudents
} = require('../controllers/studentController');

// It's common practice to have middleware in its own directory
const { protect } = require('../middleware/authMiddleware');
const { isTeacher } = require('../middleware/roleMiddleware');

const router = express.Router();

// Configure multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Route to add a single student to a class
// POST /api/students/add/:classId
router.post('/add/:classId', protect, isTeacher, addStudentToClass);

// Route to bulk register students from a CSV file
// POST /api/students/bulk-register/:classId
router.post('/bulk-register/:classId', protect, isTeacher, upload.single('file'), bulkRegisterStudents);

// Route to get information for a single student
// GET /api/students/:id
router.get('/:id', protect, getStudentInfo);

module.exports = router;