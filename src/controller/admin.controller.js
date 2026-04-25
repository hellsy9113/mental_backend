// src/controller/admin.controller.js

const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  assignStudentToCounsellor,
  unassignStudentFromCounsellor,
  getPlatformStats,
} = require('../services/admin.services');

const { createStaffUser } = require('../services/auth.services');

// GET /admin/users?role=student|counsellor|admin
async function listUsers(req, res) {
  try {
    const { role } = req.query;
    const users = await getAllUsers(role);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('[admin] listUsers error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: statusCode < 500 ? error.message : 'Internal server error' });
  }
}

// GET /admin/users/:id
async function getUser(req, res) {
  try {
    const user = await getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[admin] getUser error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: statusCode < 500 ? error.message : 'Internal server error' });
  }
}

// POST /admin/users  — create counsellor or admin account
// Body: { name, email, password, role }
async function createUser(req, res) {
  try {
    const user = await createStaffUser(req.body);
    // Never return password
    const { password: _p, ...safe } = user.toObject ? user.toObject() : user;
    res.status(201).json({ success: true, data: safe });
  } catch (error) {
    console.error('[admin] createUser error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: statusCode < 500 ? error.message : 'Internal server error' });
  }
}

// PATCH /admin/users/:id/role
async function changeUserRole(req, res) {
  try {
    const { role } = req.body;
    const user = await updateUserRole(req.params.id, role);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[admin] changeUserRole error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: statusCode < 500 ? error.message : 'Internal server error' });
  }
}

// DELETE /admin/users/:id
async function removeUser(req, res) {
  try {
    const result = await deleteUser(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[admin] removeUser error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: statusCode < 500 ? error.message : 'Internal server error' });
  }
}

// POST /admin/assign
// Body: { counsellorId, studentId }
async function assignStudent(req, res) {
  try {
    const { counsellorId, studentId } = req.body;
    const profile = await assignStudentToCounsellor(counsellorId, studentId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('[admin] assignStudent error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: statusCode < 500 ? error.message : 'Internal server error' });
  }
}

// DELETE /admin/assign
// Body: { counsellorId, studentId }
async function unassignStudent(req, res) {
  try {
    const { counsellorId, studentId } = req.body;
    const profile = await unassignStudentFromCounsellor(counsellorId, studentId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('[admin] unassignStudent error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: statusCode < 500 ? error.message : 'Internal server error' });
  }
}

// GET /admin/stats
async function platformStats(req, res) {
  try {
    const stats = await getPlatformStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('[admin] platformStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load platform stats' });
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  changeUserRole,
  removeUser,
  assignStudent,
  unassignStudent,
  platformStats,
};