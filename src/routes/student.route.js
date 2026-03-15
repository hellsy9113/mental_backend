/**
 * src/routes/student.route.js  ── UPDATED
 *
 * Added:
 *   GET /student/sessions   → student's own session list
 *   GET /student/counsellor → assigned counsellor info
 *
 * Mounted in app.js as:  app.use('/dashboard', studentRoutes)
 * So full paths are:
 *   GET /dashboard/student
 *   PATCH /dashboard/student
 *   GET /dashboard/student/sessions
 *   GET /dashboard/student/counsellor
 */

const express = require('express');
const {
  studentDashBoard,
  updateDashboard,
  listStudentSessions,
  getAssignedCounsellor,
} = require('../controller/student.controller');
const { verifyToken, isStudent } = require('../middleware/auth.middleware');

const router = express.Router();

// All student dashboard routes require auth + student role
router.use(verifyToken, isStudent);

router.get   ('/student',            studentDashBoard);
router.patch ('/student',            updateDashboard);
router.get   ('/student/sessions',   listStudentSessions);
router.get   ('/student/counsellor', getAssignedCounsellor);

module.exports = router;