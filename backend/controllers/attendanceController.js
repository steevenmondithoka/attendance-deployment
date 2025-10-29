const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Student = require('../models/Student');

// No real-time dashboard updates are needed in this controller.

// @desc    Mark attendance for a class
// @route   POST /api/attendance/mark
// @access  Private (Teacher)
exports.markAttendance = async (req, res) => {
    const { classId, date, records } = req.body;
    try {
        const course = await Class.findById(classId);
        if (!course || course.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to mark attendance for this class' });
        }
        
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({ classId, date: attendanceDate });
        if (attendance) {
            records.forEach(record => {
                const studentRecord = attendance.records.find(r => r.studentId.toString() === record.studentId);
                if (studentRecord) studentRecord.status = record.status;
                else attendance.records.push(record);
            });
            await attendance.save();
        } else {
            attendance = new Attendance({ classId, date: attendanceDate, records });
            await attendance.save();
        }
        
        res.status(201).json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get attendance for a class on a specific date
// @route   GET /api/attendance/class/:id?date=YYYY-MM-DD
// @access  Private
exports.getClassAttendance = async (req, res) => {
    try {
        const aClass = await Class.findById(req.params.id);
        if (!aClass) return res.status(404).json({ msg: 'Class not found' });
        if (req.user.role === 'teacher' && aClass.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        
        const attendanceDate = new Date(req.query.date);
        attendanceDate.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ classId: req.params.id, date: attendanceDate })
            .populate({
                path: 'records.studentId',
                model: 'Student',
                populate: { path: 'user', model: 'User', select: 'name' }
            });

        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/:id
// @access  Private
exports.getStudentAttendanceHistory = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.params.id });
        if (!student) {
            return res.status(404).json({ msg: 'Student record not found for this user.' });
        }
        if (req.user.role === 'student' && req.user.id !== req.params.id) {
             return res.status(403).json({ msg: 'Not authorized to view this attendance history' });
        }
        
        const attendanceHistory = await Attendance.find({ 'records.studentId': student._id })
            .populate({ path: 'classId', select: 'name subject' })
            .sort({ date: -1 });

        const studentSpecificHistory = attendanceHistory.map(att => ({
            _id: att._id,
            date: att.date,
            classId: att.classId,
            records: att.records.filter(rec => rec.studentId.toString() === student._id.toString())
        }));
            
        res.json(studentSpecificHistory);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};