const express = require('express');
const { register, login, updatePassword, createTeacher } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Route for general user registration
router.post('/register', register);

// Route for logging in any user
router.post('/login', login);

// Route for updating password (requires login)
router.put('/update-password', protect, updatePassword);

// Route specifically for an admin to create a teacher (requires login + admin role)
router.post('/create-teacher', protect, isAdmin, createTeacher);

module.exports = router;