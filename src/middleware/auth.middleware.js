// 






const jwt = require('jsonwebtoken');

// ──────────────────────────────────────────────
// verifyToken — validates JWT and attaches decoded
// payload to req.user for downstream middleware
// ──────────────────────────────────────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

// ──────────────────────────────────────────────
// Role-based middleware
// Usage: router.get('/route', verifyToken, isAdmin, handler)
// ──────────────────────────────────────────────

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access forbidden. Admins only.'
  });
}

function isCounsellor(req, res, next) {
  if (req.user && req.user.role === 'counsellor') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access forbidden. Counsellors only.'
  });
}

function isStudent(req, res, next) {
  if (req.user && req.user.role === 'student') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access forbidden. Students only.'
  });
}

// Allows counsellors and admins (not students)
function isCounsellorOrAdmin(req, res, next) {
  if (req.user && (req.user.role === 'counsellor' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access forbidden. Counsellors or admins only.'
  });
}

module.exports = {
  verifyToken,
  isAdmin,
  isCounsellor,
  isStudent,
  isCounsellorOrAdmin
};
