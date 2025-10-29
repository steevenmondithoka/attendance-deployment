const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    rollNo: {
        type: String,
        required: true,
    },
    
});

module.exports = mongoose.model('Student', StudentSchema);