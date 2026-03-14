const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ──────────────────────────────────────────────────────────────────
// verifyToken
//
// 1. Validates the JWT signature and expiry (no DB hit — fast).
// 2. Compares the token's embedded tokenVersion against the DB value.
//    If they don't match the token is stale (role was changed after
//    this token was issued) → 401, user must re-login.
//
// The DB check only happens once per request and only reads one field,
// so the overhead is minimal. It is what makes role-change security work.
// ──────────────────────────────────────────────────────────────────
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Invalid authorization format. Use: Bearer <token>' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  // Token version check — catches stale tokens after a role change
  // Only runs a DB query when the token carries a version (new tokens do;
  // old tokens without the field are given a free pass via `?? 0` fallback
  // so existing sessions aren't broken on first deploy).
  try {
    const user = await User.findById(decoded.id).select('tokenVersion').lean();
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    const tokenVer = decoded.tokenVersion ?? 0;
    const dbVer    = user.tokenVersion    ?? 0;

    if (tokenVer !== dbVer) {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
  } catch {
    return res.status(500).json({ success: false, error: 'Token verification failed' });
  }

  req.user = decoded;
  next();
}

// ──────────────────────────────────────────────────────────────────
// Role guards — always used AFTER verifyToken
// ──────────────────────────────────────────────────────────────────

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, error: 'Access forbidden. Admins only.' });
}

function isCounsellor(req, res, next) {
  if (req.user?.role === 'counsellor') return next();
  return res.status(403).json({ success: false, error: 'Access forbidden. Counsellors only.' });
}

function isStudent(req, res, next) {
  if (req.user?.role === 'student') return next();
  return res.status(403).json({ success: false, error: 'Access forbidden. Students only.' });
}

function isCounsellorOrAdmin(req, res, next) {
  if (req.user?.role === 'counsellor' || req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, error: 'Access forbidden. Counsellors or admins only.' });
}

module.exports = { verifyToken, isAdmin, isCounsellor, isStudent, isCounsellorOrAdmin };