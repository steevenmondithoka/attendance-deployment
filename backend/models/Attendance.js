const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    records: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late'],
            required: true,
        },
    }],
});

// Ensure that for a given class and date, there is only one attendance document
AttendanceSchema.index({ classId: 1, date: 1 }, { unique: true });


module.exports = mongoose.model('Attendance', AttendanceSchema);