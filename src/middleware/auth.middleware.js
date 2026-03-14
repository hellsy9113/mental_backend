const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ──────────────────────────────────────────────────────────────────
// verifyToken
//
// Validates JWT then checks tokenVersion to catch stale tokens
// issued before a role-change.
//
// Safe defaults:
//   - Token has no tokenVersion field  → treat as 0  (old tokens)
//   - DB user has no tokenVersion field → treat as 0  (seeded / old accounts)
//
// This means an admin or counsellor seeded directly into MongoDB
// without a tokenVersion field will NOT be rejected — both sides
// resolve to 0 and the check passes.
// ──────────────────────────────────────────────────────────────────
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No token provided.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>'
    });
  }

  const token = parts[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  // Token version check — catches stale tokens after a role change.
  // Both sides default to 0 so old/seeded accounts with no tokenVersion
  // field in the DB are never incorrectly rejected.
  try {
    const user = await User.findById(decoded.id).select('tokenVersion').lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists'
      });
    }

    const tokenVer = decoded.tokenVersion ?? 0;
    const dbVer    = user.tokenVersion    ?? 0;

    if (tokenVer !== dbVer) {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.'
      });
    }
  } catch {
    return res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }

  req.user = decoded;
  next();
}

// ── Role guards — always used AFTER verifyToken ───────────────────

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({
    success: false,
    error: 'Access forbidden. Admins only.'
  });
}

function isCounsellor(req, res, next) {
  if (req.user?.role === 'counsellor') return next();
  return res.status(403).json({
    success: false,
    error: 'Access forbidden. Counsellors only.'
  });
}

function isStudent(req, res, next) {
  if (req.user?.role === 'student') return next();
  return res.status(403).json({
    success: false,
    error: 'Access forbidden. Students only.'
  });
}

function isCounsellorOrAdmin(req, res, next) {
  if (req.user?.role === 'counsellor' || req.user?.role === 'admin') return next();
  return res.status(403).json({
    success: false,
    error: 'Access forbidden. Counsellors or admins only.'
  });
}

module.exports = { verifyToken, isAdmin, isCounsellor, isStudent, isCounsellorOrAdmin };