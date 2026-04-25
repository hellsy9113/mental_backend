// src/routes/admin.routes.js

const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
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

const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'counsellor', 'admin']).withMessage('Invalid role'),
  validate
];

const assignValidation = [
  body('counsellorId').isMongoId().withMessage('Valid counsellor ID is required'),
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  validate
];

const router = express.Router();

// All admin routes require authentication + admin role
router.use(verifyToken, isAdmin);

router.get   ('/stats',           platformStats);
router.get   ('/users',           listUsers);           // GET  /admin/users?role=student
router.get   ('/users/:id',       getUser);             // GET  /admin/users/:id
router.post  ('/users',           createUserValidation, createUser);          // POST /admin/users  (create staff)
router.patch ('/users/:id/role',  changeUserRole);      // PATCH /admin/users/:id/role
router.delete('/users/:id',       removeUser);          // DELETE /admin/users/:id
router.post  ('/assign',          assignValidation, assignStudent);       // POST /admin/assign
router.delete('/assign',          assignValidation, unassignStudent);     // DELETE /admin/assign

module.exports = router;