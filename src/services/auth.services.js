const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const StudentDashboard = require('../models/StudentDashboard');
const CounsellorProfile = require('../models/CounsellorProfile');

// ──────────────────────────────────────────────────────────────────
// registerUser  (public — role always forced to 'student')
// ──────────────────────────────────────────────────────────────────
async function registerUser(userData) {
  const { name, email, password } = userData;

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

  const newUserData = {
    name,
    email,
    password:        hashedPassword,
    role:            'student',
    profileComplete: false,   // triggers onboarding
    tokenVersion:    0,
  };

  const supportsTransactions =
    mongoose.connection.client?.topology?.description?.type !== 'Single';

  if (supportsTransactions) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [user] = await User.create([newUserData], { session });
      await StudentDashboard.create([{ userId: user._id }], { session });
      await session.commitTransaction();
      session.endSession();
      return user;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } else {
    const user = await User.create(newUserData);
    await StudentDashboard.create({ userId: user._id });
    return user;
  }
}

// ──────────────────────────────────────────────────────────────────
// createStaffUser  (admin-only — creates counsellor or admin accounts)
// ──────────────────────────────────────────────────────────────────
async function createStaffUser({ name, email, password, role }) {
  if (!name || !email || !password || !role) {
    const error = new Error('name, email, password and role are required');
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
    profileComplete: true,   // staff never see onboarding
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

// ──────────────────────────────────────────────────────────────────
// loginUser
//
// Returns a role-aware user object:
//   - All roles get: id, name, email, role, bio, avatarColor
//   - Students also get: institution, course, courseStartYear, profileComplete
//   - Admin / Counsellor get: profileComplete always true (never see onboarding)
//
// profileComplete uses ?? true so any seeded/legacy account without
// the field in the DB is treated as complete and never sees onboarding.
// ──────────────────────────────────────────────────────────────────
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

  const token = jwt.sign(
    {
      id:           user._id,
      email:        user.email,
      role:         user.role,
      tokenVersion: user.tokenVersion ?? 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // ── Base fields — every role gets these ──────────────────────────
  const baseUser = {
    id:          user._id,
    name:        user.name,
    email:       user.email,
    role:        user.role,
    bio:         user.bio         || '',
    avatarColor: user.avatarColor || '',
  };

  // ── Role-specific fields ─────────────────────────────────────────
  if (user.role === 'student') {
    return {
      token,
      user: {
        ...baseUser,
        institution:     user.institution     || '',
        course:          user.course          || '',
        courseStartYear: user.courseStartYear || null,
        // Explicit false = new student who needs onboarding.
        // undefined / null / true = complete. ?? false keeps the
        // intent: only explicitly-false triggers the setup flow.
        profileComplete: user.profileComplete ?? false,
      },
    };
  }

  // Admin and counsellor — never send student-only fields,
  // never send profileComplete: false (they have no onboarding).
  return {
    token,
    user: {
      ...baseUser,
      profileComplete: true,  // hard-coded — staff never see onboarding
    },
  };
}

module.exports = { registerUser, createStaffUser, loginUser };