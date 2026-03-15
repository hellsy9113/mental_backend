/**
 * src/services/auth.services.js  ── PATCHED
 *
 * Fix: added `name` to the JWT payload.
 *
 * Previously the token only contained { id, email, role, tokenVersion }.
 * socket.js reads socket.user.name to set senderName on messages — without
 * this field every message was saved with senderName = '' (empty string),
 * and the sender's name never appeared in chat bubbles.
 */

const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const User              = require('../models/User');
const CounsellorProfile = require('../models/CounsellorProfile');
const StudentDashboard  = require('../models/StudentDashboard');

// ── registerUser ──────────────────────────────────────────────────
async function registerUser({ name, email, password, role = 'student', institution, course, courseStartYear }) {
  if (!name || !email || !password) {
    const error = new Error('All fields are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already exists');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const supportsTransactions =
    mongoose.connection.client?.topology?.description?.type !== 'Single';

  const studentData = {
    name,
    email,
    password:        hashedPassword,
    role,
    institution:     institution     || '',
    course:          course          || '',
    courseStartYear: courseStartYear || null,
    profileComplete: role === 'student' ? false : true,
    tokenVersion:    0,
  };

  if (supportsTransactions) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [user] = await User.create([studentData], { session });
      if (role === 'student') {
        await StudentDashboard.create([{ userId: user._id }], { session });
      }
      await session.commitTransaction();
      session.endSession();
      return user;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } else {
    const user = await User.create(studentData);
    if (role === 'student') await StudentDashboard.create({ userId: user._id });
    return user;
  }
}

// ── createStaffUser ───────────────────────────────────────────────
async function createStaffUser({ name, email, password, role }) {
  if (!name || !email || !password || !role) {
    const error = new Error('Name, email, password, and role are required');
    error.statusCode = 400;
    throw error;
  }

  if (!['counsellor', 'admin'].includes(role)) {
    const error = new Error('Staff role must be counsellor or admin');
    error.statusCode = 400;
    throw error;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already exists');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const staffData = {
    name,
    email,
    password:        hashedPassword,
    role,
    profileComplete: true,
    tokenVersion:    0,
  };

  const supportsTransactions =
    mongoose.connection.client?.topology?.description?.type !== 'Single';

  if (supportsTransactions) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [user] = await User.create([staffData], { session });
      if (role === 'counsellor') {
        await CounsellorProfile.create([{ userId: user._id }], { session });
      }
      await session.commitTransaction();
      session.endSession();
      return user;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } else {
    const user = await User.create(staffData);
    if (role === 'counsellor') await CounsellorProfile.create({ userId: user._id });
    return user;
  }
}

// ── loginUser ─────────────────────────────────────────────────────
async function loginUser({ email, password }) {
  if (!email || !password) {
    const error = new Error('All fields are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatched = await bcrypt.compare(password, user.password);
  if (!isMatched) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // ── FIX: include `name` in JWT so socket.user.name is available ──
  const token = jwt.sign(
    {
      id:           user._id,
      name:         user.name,          // ← ADDED
      email:        user.email,
      role:         user.role,
      tokenVersion: user.tokenVersion ?? 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const baseUser = {
    id:          user._id,
    name:        user.name,
    email:       user.email,
    role:        user.role,
    bio:         user.bio         || '',
    avatarColor: user.avatarColor || '',
  };

  if (user.role === 'student') {
    return {
      token,
      user: {
        ...baseUser,
        institution:     user.institution     || '',
        course:          user.course          || '',
        courseStartYear: user.courseStartYear || null,
        profileComplete: user.profileComplete ?? false,
      },
    };
  }

  return {
    token,
    user: {
      ...baseUser,
      profileComplete: true,
    },
  };
}

module.exports = { registerUser, createStaffUser, loginUser };