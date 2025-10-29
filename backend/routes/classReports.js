const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const moment = require('moment'); 
const mongoose = require('mongoose'); // Import mongoose to check types

// ** Mongoose/Database Models **
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Student = require('../models/Student');
const User = require('../models/User'); 

// --- NEW UTILITY: Deeply convert ObjectIds to strings ---
const jsonifyMongoose = (doc) => {
    if (!doc) return doc;
    // If it's a Mongoose Document, convert to plain object first
    let obj = (typeof doc.toObject === 'function') ? doc.toObject() : doc;

    // Recursively handle arrays and objects
    if (Array.isArray(obj)) {
        return obj.map(jsonifyMongoose);
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                
                // Convert ObjectId instances to strings
                if (value && typeof value === 'object' && mongoose.Types.ObjectId.isValid(value)) {
                    obj[key] = value.toString();
                } 
                // Recursively call for nested objects/arrays
                else if (typeof value === 'object' && value !== null) {
                    obj[key] = jsonifyMongoose(value);
                }
            }
        }
    }
    return obj;
};

// Utility function to map status
const formatStatus = (status) => {
    switch(status) {
        case 'Present': return 'P';
        case 'Absent': return 'A';
        case 'Late': return 'L';
        case 'NOT_TAKEN': return 'N/A';
        default: return '-';
    }
}

// Utility to generate a list of all dates in a range (YYYY-MM-DD)
const getDatesInRange = (start, end) => {
    const dates = [];
    let current = moment.utc(start).startOf('day');
    const last = moment.utc(end).startOf('day');

    while (current.isSameOrBefore(last)) {
        dates.push(current.format('YYYY-MM-DD'));
        current.add(1, 'days');
    }
    return dates;
};

// --- CORE PDF GENERATION FUNCTION (Unchanged) ---
const generatePdfTable = (doc, data, headers, columnWidths = [50, 200, 100]) => {
    const tableTop = doc.y;
    const itemHeight = 20;
    const headerRowHeight = 25;
    
    const totalWidth = columnWidths.reduce((a, b) => a + b, 0);

    // Draw Table Header
    doc.fillColor('#444444').font('Helvetica-Bold').fontSize(10);
    let currentX = 50;
    headers.forEach((header, i) => {
        doc.text(header, currentX, tableTop + 5, { 
            width: columnWidths[i], 
            align: (i === 0 || i === 1) ? 'left' : 'center'
        });
        currentX += columnWidths[i];
    });
    
    // Draw Header Separator Line
    const tableEnd = 50 + totalWidth;
    doc.lineWidth(1).lineCap('butt').moveTo(50, tableTop + headerRowHeight).lineTo(tableEnd, tableTop + headerRowHeight).stroke('#aaaaaa');

    doc.font('Helvetica').fontSize(9);
    
    // Draw Table Rows
    let currentY = tableTop + headerRowHeight;
    data.forEach(row => {
        currentY += itemHeight;

        // Add page break if needed
        if (currentY > 750) {
            doc.addPage(columnWidths.length > 3 ? { layout: 'landscape' } : {}); 
            currentY = 50; 
        }
        
        let rowX = 50;
        // Draw Row Cells
        row.forEach((cellText, i) => {
            doc.text(cellText, rowX, currentY + 5, {
                width: columnWidths[i],
                align: (i === 0 || i === 1) ? 'left' : 'center'
            });
            rowX += columnWidths[i];
        });
        
        // Draw Row Separator Line
        doc.lineWidth(0.5).lineCap('butt').moveTo(50, currentY + itemHeight).lineTo(tableEnd, currentY + itemHeight).stroke('#eeeeee');
    });
};


// --- DAILY REPORT HANDLER (Applying jsonifyMongoose) ---
router.get('/:classId/report/daily', async (req, res) => {
    const { classId } = req.params;
    const dateString = req.query.date; 

    if (!dateString) {
        return res.status(400).send('Date query parameter (YYYY-MM-DD) is required.');
    }
    
    const reportDate = moment.utc(dateString).startOf('day').toDate();
    const formattedDate = moment(reportDate).format('MMMM D, YYYY');

    try {
        let classData = await Class.findById(classId).populate({
            path: 'students', 
            select: 'user', 
            populate: { path: 'user', select: 'name' }
        });
        classData = jsonifyMongoose(classData); // <--- FORCE TO PLAIN OBJECTS/STRINGS
        
        if (!classData) return res.status(404).send('Class not found.');

        let attendanceRecord = await Attendance.findOne({ classId, date: reportDate });
        attendanceRecord = jsonifyMongoose(attendanceRecord); // <--- FORCE TO PLAIN OBJECTS/STRINGS

        // *** FIX for "Did Not Take Attendance" ***
        if (!attendanceRecord) {
            // ... (PDF generation for NOT TAKEN) ...
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Daily_Attendance_NotTaken_${classData.name}_${dateString}.pdf`);
            const doc = new PDFDocument({ margin: 30 });
            doc.pipe(res);
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(18)
                .text(`Daily Attendance Report`, { align: 'center' })
                .fontSize(14)
                .text(`Class: ${classData.name}`, { align: 'center' })
                .fontSize(12)
                .text(`Date: ${formattedDate}`, { align: 'center' })
                .moveDown(2)
                .font('Helvetica').fontSize(16)
                .fillColor('red')
                .text(`Attendance NOT TAKEN for this date.`, { align: 'center' })
                .end();
            return;
        }
        // ***************************************

        // --- Prepare Data for PDF ---
        const pdfData = classData.students.map((student, index) => {
            const studentName = student.user ? student.user.name : 'Unknown Student';
            // Both IDs are now guaranteed strings thanks to jsonifyMongoose
            const studentId = student._id; 
            const statusRecord = attendanceRecord.records.find(r => r.studentId === studentId);
            
            return [
                (index + 1).toString(), // Roll/Index Number
                studentName, 
                // *** FIX: Must use formatStatus for the daily report status ***
                statusRecord ? formatStatus(statusRecord.status) : 'A' 
            ];
        });

        // --- PDF GENERATION ---
        const doc = new PDFDocument({ margin: 30 });
        // ... (rest of daily PDF generation) ...
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Daily_Attendance_${classData.name}_${dateString}.pdf`);

        doc.pipe(res);

        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(18)
            .text(`Daily Attendance Report`, { align: 'center' })
            .fontSize(14)
            .text(`Class: ${classData.name}`, { align: 'center' })
            .fontSize(12)
            .text(`Date: ${formattedDate}`, { align: 'center' })
            .moveDown(1.5);
        
        generatePdfTable(doc, pdfData, ['Roll No.', 'Student Name', 'Attendance Status']);

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error (Daily):', err);
        res.status(500).send(`Failed to generate daily report: ${err.message}`);
    }
});


// --- MONTHLY REPORT HANDLER (Applying jsonifyMongoose) ---
router.get('/:classId/report/monthly', async (req, res) => {
    const { classId } = req.params;
    const month = req.query.month || moment().month() + 1; 
    const year = req.query.year || moment().year();

    const startDate = moment.utc(`${year}-${month}-01`).startOf('month').toDate();
    const endDate = moment.utc(startDate).endOf('month').toDate();
    const formattedPeriod = moment(startDate).format('MMMM YYYY');

    try {
        let classData = await Class.findById(classId).populate({
            path: 'students', 
            select: 'user rollNumber', 
            populate: { path: 'user', select: 'name' }
        });
        classData = jsonifyMongoose(classData); // <--- FORCE TO PLAIN OBJECTS/STRINGS
        
        if (!classData) return res.status(404).send('Class not found.');

        // 1. Determine the TOTAL number of days in the period
        const allDatesInMonth = getDatesInRange(startDate, endDate);
        const totalPossibleClasses = allDatesInMonth.length;

        // 2. Fetch all attendance records for the month
        let monthlyAttendance = await Attendance.find({
            classId,
            date: { $gte: startDate, $lte: endDate }
        });
        monthlyAttendance = jsonifyMongoose(monthlyAttendance); // <--- FORCE TO PLAIN OBJECTS/STRINGS

        const recordedClasses = monthlyAttendance.length;
        const missedClasses = totalPossibleClasses - recordedClasses;

        // 3. Aggregate student data
        const studentSummaryMap = new Map();

        classData.students.forEach(student => {
            studentSummaryMap.set(student._id, { // ID is now a reliable string
                rollNumber: student.rollNumber || 'N/A',
                name: student.user ? student.user.name : 'Unknown Student',
                P: 0, A: 0, L: 0, 
            });
        });

        monthlyAttendance.forEach(dayRecord => {
            dayRecord.records.forEach(record => {
                const studentId = record.studentId; // ID is now a reliable string
                if (studentSummaryMap.has(studentId)) {
                    const summary = studentSummaryMap.get(studentId);
                    if (record.status === 'Present') summary.P += 1;
                    else if (record.status === 'Absent') summary.A += 1;
                    else if (record.status === 'Late') summary.L += 1;
                }
            });
        });

        // 4. Prepare PDF data
        // ... (rest of monthly PDF preparation) ...
        const pdfData = Array.from(studentSummaryMap.values()).map(summary => {
            const totalPresent = summary.P;
            const percentage = recordedClasses > 0 ? ((totalPresent / recordedClasses) * 100).toFixed(1) : '0.0';
            
            return [
                summary.rollNumber,
                summary.name,
                `P: ${summary.P}, A: ${summary.A}, L: ${summary.L} (Pct: ${percentage}%)`
            ];
        });

        // --- PDF GENERATION ---
        const doc = new PDFDocument({ margin: 30 });
        // ... (rest of monthly PDF generation) ...
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Monthly_Attendance_${classData.name}_${moment(startDate).format('YYYYMM')}.pdf`);

        doc.pipe(res);

        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(18)
            .text(`Monthly Attendance Summary`, { align: 'center' })
            .fontSize(14)
            .text(`Class: ${classData.name}`, { align: 'center' })
            .fontSize(12)
            .text(`Period: ${formattedPeriod}`, { align: 'center' })
            .moveDown(1.5);
        
        generatePdfTable(doc, pdfData, ['Roll No.', 'Student Name', 'Attendance Breakdown'], [50, 200, 250]);
        
        // Summary added to monthly report
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(10).text('--- Class Summary ---');
        doc.font('Helvetica').fontSize(10).text(`Total Days in Period: ${totalPossibleClasses}`);
        doc.font('Helvetica').fontSize(10).text(`Attendance Records Taken: ${recordedClasses}`);
        doc.font('Helvetica').fontSize(10).fillColor('red').text(`Attendance NOT TAKEN on ${missedClasses} day(s).`);

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error (Monthly):', err);
        res.status(500).send(`Failed to generate monthly report: ${err.message}`);
    }
});


// --- RANGE REPORT HANDLER (Applying jsonifyMongoose) ---
router.get('/:classId/report/range', async (req, res) => {
    const { classId } = req.params;
    const { startDate: startString, endDate: endString } = req.query;

    if (!startString || !endString) {
        return res.status(400).send('Start Date and End Date query parameters (YYYY-MM-DD) are required.');
    }
    
    const startDate = moment.utc(startString).startOf('day').toDate();
    const endDate = moment.utc(endString).startOf('day').toDate();
    const formattedPeriod = `${moment(startDate).format('MMM D, YYYY')} - ${moment(endDate).format('MMM D, YYYY')}`;

    try {
        // 1. Fetch Class and Student Data
        let classData = await Class.findById(classId).populate({
            path: 'students', 
            select: 'user rollNumber', 
            populate: { path: 'user', select: 'name' }
        });
        classData = jsonifyMongoose(classData); // <--- FORCE TO PLAIN OBJECTS/STRINGS

        if (!classData) return res.status(404).send('Class not found.');
        
        // 2. Get all class dates in range and attendance records
        const allDates = getDatesInRange(startDate, endDate);
        const dateCount = allDates.length;

        // Fetch all attendance for the range
        let monthlyAttendance = await Attendance.find({
            classId,
            date: { $gte: startDate, $lte: endDate }
        });
        monthlyAttendance = jsonifyMongoose(monthlyAttendance); // <--- FORCE TO PLAIN OBJECTS/STRINGS

        // 3. Map attendance to an object for fast lookup by date
        const attendanceMap = monthlyAttendance.reduce((acc, record) => {
            const dateKey = moment.utc(record.date).format('YYYY-MM-DD');
            acc[dateKey] = record.records.reduce((rAcc, rec) => {
                rAcc[rec.studentId] = rec.status; // studentId is now a string
                return rAcc;
            }, {});
            return acc;
        }, {});

        // 4. Prepare PDF Headers
        const headers = ['R. No.', 'Student Name', ...allDates.map(d => moment(d).format('MM/DD'))];
        
        // Calculate dynamic column widths 
        const totalPageWidth = 792 - 60; 
        const fixedWidths = [50, 150]; 
        const fixedWidthSum = fixedWidths.reduce((a, b) => a + b, 0); 
        const dateColumnWidth = Math.max(25, (totalPageWidth - fixedWidthSum) / dateCount); 
        const columnWidths = [...fixedWidths, ...Array(dateCount).fill(dateColumnWidth)];

        // 5. Prepare PDF Data (Student Rows)
        const pdfData = classData.students.map(student => {
            const studentId = student._id; // Guaranteed string
            const studentName = student.user ? student.user.name : 'Unknown';
            
            const row = [student.rollNumber || 'N/A', studentName];

            // Iterate through every date in the range 
            allDates.forEach(dateKey => {
                const dayAttendance = attendanceMap[dateKey];

                let status = '-'; 

                if (!dayAttendance) {
                    status = formatStatus('NOT_TAKEN'); // Shows 'N/A'
                } else if (dayAttendance[studentId]) {
                    status = formatStatus(dayAttendance[studentId]);
                }
                
                row.push(status);
            });

            return row;
        });


        // --- PDF GENERATION ---
        const doc = new PDFDocument({ margin: 30, layout: 'landscape' }); 
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Range_Attendance_${classData.name}_${moment(startDate).format('YYYYMMDD')}_to_${moment(endDate).format('YYYYMMDD')}.pdf`);

        doc.pipe(res);

        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(18)
            .text(`Attendance Report by Date Range`, { align: 'center' })
            .fontSize(14)
            .text(`Class: ${classData.name}`, { align: 'center' })
            .fontSize(12)
            .text(`Period: ${formattedPeriod}`, { align: 'center' })
            .moveDown(1.5);
        
        generatePdfTable(doc, pdfData, headers, columnWidths);

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error (Range):', err);
        res.status(500).send(`Failed to generate range report: ${err.message}`);
    }
});


module.exports = router;