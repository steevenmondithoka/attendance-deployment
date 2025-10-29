const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// exports.createTeacher - CRASH PREVENTION IMPLEMENTED
exports.createTeacher = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'teacher' // Hardcode the role to 'teacher'
        });

        await user.save();

        // --- REAL-TIME UPDATE CRASH PREVENTION ---
        try {
            await req.emitDashboardData();
        } catch(dashboardErr) {
            // Log the error but DO NOT let it stop the main process
            console.error("Non-fatal: Failed to emit dashboard data after teacher creation:", dashboardErr.message);
        }
        // --- END CRASH PREVENTION ---

        res.status(201).json({ success: true, msg: 'Teacher account created successfully.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// exports.register - CRASH PREVENTION IMPLEMENTED
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        
        user = new User({ name, email, password, role });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // --- REAL-TIME UPDATE CRASH PREVENTION ---
        try {
            await req.emitDashboardData();
        } catch(dashboardErr) {
            // Log the error but DO NOT let it stop the main process
            console.error("Non-fatal: Failed to emit dashboard data after registration:", dashboardErr.message);
        }
        // --- END CRASH PREVENTION ---

        const payload = { id: user.id, role: user.role, name: user.name };
        // The process.env.JWT_SECRET must be set on Render for this line to work!
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); 
        res.status(201).json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide an email and password' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id).select('+password');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Incorrect current password.' });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ success: true, msg: 'Password updated successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};