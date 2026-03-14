// src/routes/admin.routes.js

const express = require('express');
const {
  listUsers,
  getUser,
  changeUserRole,
  removeUser,
  assignStudent,
  unassignStudent,
  createUser,
  platformStats,
} = require('../controller/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(verifyToken, isAdmin);

router.get   ('/stats',           platformStats);
router.get   ('/users',           listUsers);           // GET  /admin/users?role=student
router.get   ('/users/:id',       getUser);             // GET  /admin/users/:id
router.post  ('/users',           createUser);          // POST /admin/users  (create staff)
router.patch ('/users/:id/role',  changeUserRole);      // PATCH /admin/users/:id/role
router.delete('/users/:id',       removeUser);          // DELETE /admin/users/:id
router.post  ('/assign',          assignStudent);       // POST /admin/assign
router.delete('/assign',          unassignStudent);     // DELETE /admin/assign

module.exports = router;