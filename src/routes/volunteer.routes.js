const express = require('express');
const {
  submit,
  getMyApp,
  withdraw,
  list,
  getOne,
  assign,
  cReview,
  remove
} = require('../controller/volunteer.controller');
const { verifyToken, isStudent, isAdmin, isCounsellor } = require('../middleware/auth.middleware');

const router = express.Router();

// Student routes
// POST /api/volunteer/
router.post('/', verifyToken, isStudent, submit);

// GET /api/volunteer/me
router.get('/me', verifyToken, isStudent, getMyApp);

// DELETE /api/volunteer/me
router.delete('/me', verifyToken, isStudent, withdraw);

// Shared / Admin / Counsellor routes
// GET /api/volunteer/admin/applications (Admin & Counsellor can list)
router.get('/admin/applications', verifyToken, list);

// GET /api/volunteer/admin/applications/:id (Admin & Counsellor can view)
router.get('/admin/applications/:id', verifyToken, getOne);

// Admin only routes
// PATCH /api/volunteer/admin/assign/:id
router.patch('/admin/assign/:id', verifyToken, isAdmin, assign);

// Counsellor only routes
// PATCH /api/volunteer/counsellor/review/:id
router.patch('/counsellor/review/:id', verifyToken, isCounsellor, cReview);

// Removal route (Admin or assigned Counsellor)
// DELETE /api/volunteer/remove/:id
router.delete('/remove/:id', verifyToken, remove);

module.exports = router;
