const express = require("express");
const {
  createClass,
  getTeacherClasses,
  getClassDetails,
  deleteClass,
} = require("../controllers/classController");
const { protect } = require("../middleware/authMiddleware");
const { isTeacher } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, isTeacher, createClass);
router.get("/", protect, isTeacher, getTeacherClasses);

router.route("/:id").get(protect, getClassDetails).delete(protect, deleteClass);
module.exports = router;
