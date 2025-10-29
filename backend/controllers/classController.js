const Class = require('../models/Class');

// @desc    Create a new class
// @route   POST /api/class
// @access  Private (Teacher)
exports.createClass = async (req, res) => {
    const { name, subject } = req.body;
    try {
        const existingClass = await Class.findOne({ name, subject, teacherId: req.user.id });
        if (existingClass) {
            return res.status(400).json({ msg: 'You have already created a class with this name and subject.' });
        }

        const newClass = new Class({ name, subject, teacherId: req.user.id });
        const savedClass = await newClass.save();

        // --- REAL-TIME UPDATE TRIGGER ---
        // After creating the class, emit an update.
        await req.emitDashboardData();

        res.status(201).json(savedClass);

    } catch (err) {
        console.error("Error in createClass:", err.message);
        res.status(500).json({ error: 'Server Error while creating class.' });
    }
};

// @desc    Get all classes for a teacher
// @route   GET /api/class
// @access  Private (Teacher)
exports.getTeacherClasses = async (req, res) => {
    try {
        const classes = await Class.find({ teacherId: req.user.id }).sort({ createdAt: -1 });
        res.json(classes);
    } catch (err) {
        console.error("Error in getTeacherClasses:", err.message);
        res.status(500).json({ error: 'Server Error while fetching classes.' });
    }
};

// @desc    Get a single class's details
// @route   GET /api/class/:id
// @access  Private (Teacher)
exports.getClassDetails = async (req, res) => {
    try {
        const aClass = await Class.findById(req.params.id).populate({
            path: 'students',
            populate: { path: 'user', model: 'User', select: 'name email' }
        });
        
        if (!aClass) {
            return res.status(404).json({ msg: 'Class not found' });
        }
        if (aClass.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to view this class' });
        }
        
        res.json(aClass);
    } catch (err) {
        console.error("Error in getClassDetails:", err.message);
        res.status(500).json({ error: 'Server Error while fetching class details.' });
    }
};

// @desc    Update a class's name or subject
// @route   PUT /api/class/:id
// @access  Private (Teacher)
exports.updateClass = async (req, res) => {
    const { name, subject } = req.body;
    try {
        let aClass = await Class.findById(req.params.id);
        if (!aClass) {
            return res.status(404).json({ msg: 'Class not found' });
        }
        if (aClass.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this class' });
        }
        
        const existingClass = await Class.findOne({ name, subject, teacherId: req.user.id, _id: { $ne: req.params.id } });
        if (existingClass) {
            return res.status(400).json({ msg: 'Another class with this name and subject already exists.' });
        }

        aClass.name = name || aClass.name;
        aClass.subject = subject || aClass.subject;

        const updatedClass = await aClass.save();
        res.json(updatedClass);

    } catch (err) {
        console.error("Error in updateClass:", err.message);
        res.status(500).json({ error: 'Server Error while updating class.' });
    }
};

// @desc    Delete a class
// @route   DELETE /api/class/:id
// @access  Private (Teacher)
exports.deleteClass = async (req, res) => {
    try {
        const aClass = await Class.findById(req.params.id);
        if (!aClass) {
            return res.status(404).json({ msg: 'Class not found' });
        }
        if (aClass.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this class' });
        }

        await aClass.deleteOne();

        // --- REAL-TIME UPDATE TRIGGER ---
        // After deleting the class, emit an update.
        await req.emitDashboardData();

        res.json({ success: true, msg: 'Class removed successfully' });

    } catch (err) {
        console.error("Error in deleteClass:", err.message);
        res.status(500).json({ error: 'Server Error while deleting class.' });
    }
};