// ─────────────────────────────────────────────────────────────────
// tests/helpers.js
// Shared factory functions used across all test files.
// Each test file imports only what it needs.
// ─────────────────────────────────────────────────────────────────
const jwt     = require('jsonwebtoken');
const User    = require('../src/models/User');
const StudentDashboard  = require('../src/models/StudentDashboard');
const CounsellorProfile = require('../src/models/CounsellorProfile');

const SECRET = process.env.JWT_SECRET || 'super_strong_random_secret_123';

/** Sign a JWT for a user document */
const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET);

/** Create a student + their dashboard, return { user, token } */
const createStudent = async (overrides = {}) => {
  const user = await User.create({
    name:     overrides.name     || 'Test Student',
    email:    overrides.email    || 'student@example.com',
    password: overrides.password || 'hashedpassword',
    role: 'student',
  });
  await StudentDashboard.create({ userId: user._id });
  return { user, token: signToken(user) };
};

/** Create a counsellor + their profile, return { user, token } */
const createCounsellor = async (overrides = {}) => {
  const user = await User.create({
    name:     overrides.name     || 'Test Counsellor',
    email:    overrides.email    || 'counsellor@example.com',
    password: overrides.password || 'hashedpassword',
    role: 'counsellor',
  });
  await CounsellorProfile.create({ userId: user._id });
  return { user, token: signToken(user) };
};

/** Create an admin user, return { user, token } */
const createAdmin = async (overrides = {}) => {
  const user = await User.create({
    name:     overrides.name     || 'Test Admin',
    email:    overrides.email    || 'admin@example.com',
    password: overrides.password || 'hashedpassword',
    role: 'admin',
  });
  return { user, token: signToken(user) };
};

module.exports = { createStudent, createCounsellor, createAdmin, signToken };