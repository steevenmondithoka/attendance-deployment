const Student = require("../models/Student");
const Class = require("../models/Class");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const csv = require("csv-parser");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

/**
 * @desc    Get a single student's information
 * @route   GET /api/students/:id
 * @access  Private
 */
exports.getStudentInfo = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("user", "name email");
    if (!student) {
      return res.status(404).json({ success: false, msg: "Student not found" });
    }
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    console.error("Error in getStudentInfo:", err.message);
    res.status(500).json({ error: "Server error while fetching student data." });
  }
};

/**
 * @desc    Add a single student to a class
 * @route   POST /api/students/add/:classId
 * @access  Private (Teacher)
 */
exports.addStudentToClass = async (req, res) => {
  const { classId } = req.params;
  const { name, email, rollNo } = req.body;

  if (!name || !email || !rollNo) {
    return res.status(400).json({ msg: "Please provide name, email, and roll number." });
  }

  try {
    const course = await Class.findById(classId);
    if (!course) {
      return res.status(404).json({ msg: "Class not found." });
    }

    let user = await User.findOne({ email });
    let student;

    if (user) {
      student = await Student.findOne({ user: user._id });
      if (!student) {
        return res.status(404).json({ msg: "User exists but is not registered as a student." });
      }
      if (course.students.includes(student._id)) {
        return res.status(400).json({ msg: "This student is already enrolled in this class." });
      }
    } else {
      const defaultPassword = "rgukt123";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      user = new User({ name, email, password: hashedPassword, role: "student" });
      await user.save();

      student = new Student({ user: user._id, rollNo });
      await student.save();

      // --- REAL-TIME UPDATE TRIGGER ---
      // A new student and user were created, so send an update.
      await req.emitDashboardData();
    }

    course.students.push(student._id);
    await course.save();

    res.status(201).json({
      success: true,
      msg: `Student ${name} successfully enrolled in the class.`,
      student: { id: student._id, name: user.name, email: user.email, rollNo: student.rollNo },
    });
  } catch (err) {
    console.error("Error in addStudentToClass:", err.message);
    res.status(500).json({ error: "Server error while enrolling the student." });
  }
};

async function processStudentRow(row, index, course, processedEmails) {
    // (This internal helper function remains unchanged)
    const normalizedRow = Object.keys(row).reduce((acc, key) => {
        acc[key.trim().toLowerCase()] = row[key];
        return acc;
    }, {});
    const { name, email, rollno } = normalizedRow;
    if (!name || !email || !rollno) {
        return { error: { row: index + 1, email: email || 'N/A', reason: "Missing required fields (name, email, rollNo)." } };
    }
    if (processedEmails.has(email)) {
        return { error: { row: index + 1, email, reason: "Duplicate email within the CSV file. Skipping." } };
    }
    processedEmails.add(email);
    try {
        let user = await User.findOne({ email });
        let student;
        if (user) {
            student = await Student.findOne({ user: user._id });
            if (!student) {
                student = new Student({ user: user._id, rollNo: rollno });
                await student.save();
            }
            if (course.students.includes(student._id)) {
                return { error: { row: index + 1, email, reason: "Student is already enrolled in this class." } };
            }
        } else {
            const defaultPassword = "rgukt123";
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultPassword, salt);
            user = new User({ name, email, password: hashedPassword, role: "student" });
            await user.save();
            student = new Student({ user: user._id, rollNo: rollno });
            await student.save();
        }
        return { studentId: student._id };
    } catch (dbError) {
        return { error: { row: index + 1, email, reason: `Database error: ${dbError.message}` } };
    }
}

/**
 * @desc    Bulk register students from a CSV file using batch processing
 * @route   POST /api/students/bulk-register/:classId
 * @access  Private (Teacher)
 */
exports.bulkRegisterStudents = async (req, res) => {
    const { classId } = req.params;
    let filePath = req.file?.path;

    if (!filePath) {
        return res.status(400).json({ msg: "No file uploaded." });
    }

    try {
        const course = await Class.findById(classId);
        if (!course) {
            return res.status(404).json({ msg: "Class not found." });
        }
        if (course.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: "You do not have permission to modify this class." });
        }

        const rows = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath).pipe(csv()).on('data', (data) => rows.push(data)).on('end', resolve).on('error', reject);
        });

        const studentsToEnroll = [];
        const errors = [];
        const processedEmails = new Set();
        const BATCH_SIZE = 20;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map((row, indexInBatch) => processStudentRow(row, i + indexInBatch, course, processedEmails));
            const results = await Promise.allSettled(batchPromises);
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.value.studentId) studentsToEnroll.push(result.value.studentId);
                    else if (result.value.error) errors.push(result.value.error);
                } else {
                    errors.push({ row: 'N/A', email: 'N/A', reason: `An unexpected error occurred: ${result.reason.message}` });
                }
            });
        }

        if (studentsToEnroll.length > 0) {
            await Class.updateOne({ _id: classId }, { $addToSet: { students: { $each: studentsToEnroll } } });
        }
        
        // --- REAL-TIME UPDATE TRIGGER ---
        // After the entire bulk process is complete, send a single update.
        if (studentsToEnroll.length > 0) {
            await req.emitDashboardData();
        }

        res.status(201).json({
            success: true,
            msg: `Bulk import complete. Processed ${rows.length} records.`,
            summary: `${studentsToEnroll.length} students enrolled successfully, ${errors.length} failed or were skipped.`,
            errors: errors,
        });

    } catch (err) {
        console.error("[Bulk Register] CRITICAL ERROR:", err.message);
        res.status(500).json({ error: "A critical server error occurred during the bulk registration process." });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try {
                await unlinkAsync(filePath);
            } catch (cleanupErr) {
                console.error("Error cleaning up uploaded file:", cleanupErr.message);
            }
        }
    }
};