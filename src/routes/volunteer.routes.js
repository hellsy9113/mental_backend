const express = require('express');
const {
  submit,
  getMyApp,
  withdraw,
  list,
  getOne,
  review
} = require('../controller/volunteer.controller');
const { verifyToken, isStudent, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Student routes
// POST /api/volunteer/
router.post('/', verifyToken, isStudent, submit);

// GET /api/volunteer/me
router.get('/me', verifyToken, isStudent, getMyApp);

// DELETE /api/volunteer/me
router.delete('/me', verifyToken, isStudent, withdraw);

// Admin routes
// GET /api/volunteer/admin/applications
router.get('/admin/applications', verifyToken, isAdmin, list);

// GET /api/volunteer/admin/applications/:id
router.get('/admin/applications/:id', verifyToken, isAdmin, getOne);

// PATCH /api/volunteer/admin/applications/:id/review
router.patch('/admin/applications/:id/review', verifyToken, isAdmin, review);

module.exports = router;
