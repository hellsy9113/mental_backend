const mongoose = require('mongoose');

const ROLES = ['student', 'counsellor', 'admin'];

// ──────────────────────────────────────────────────────────────────
// User Schema — single collection, role discriminated at app layer.
//
// Design decision: we keep one collection rather than using Mongoose
// discriminators because:
//   1. Every Session, Note, and admin query does User.findById() — a
//      single collection keeps those joins simple.
//   2. Role changes (student → counsellor) are a field update, not
//      a document migration.
//   3. The role-specific data is already in separate collections
//      (StudentDashboard, CounsellorProfile) — User is just identity.
//
// Student-only fields (institution, course, etc.) are stored here for
// now because they're needed for counsellor-matching and community
// features. They sit empty on admin/counsellor docs — a negligible
// storage cost at this scale.
// ──────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // ── Identity (all roles) ────────────────────────────────────
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: 2,
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: 6,
    },

    role: {
      type:    String,
      enum:    { values: ROLES, message: 'Role must be student, counsellor, or admin' },
      default: 'student',
    },

    // ── Display (all roles) ─────────────────────────────────────
    bio:         { type: String, default: '', maxlength: 300 },
    avatarColor: { type: String, default: '' },

    // ── Academic identity (students only) ───────────────────────
    // Stored on User rather than StudentDashboard so counsellors
    // and admins can query "all students at institution X" without
    // a join. Intentionally left empty for admin/counsellor docs.
    institution:     { type: String, default: '', trim: true, maxlength: 150 },
    course:          { type: String, default: '', trim: true, maxlength: 100 },
    courseStartYear: { type: Number, default: null, min: 1980, max: 2100 },

    // ── Onboarding flag (students only) ─────────────────────────
    // Default TRUE — safe for legacy documents and all staff accounts.
    // registerUser() explicitly sets this to false for new students
    // so they go through the first-login setup flow.
    // The frontend only reads this for role === 'student'.
    profileComplete: { type: Boolean, default: true },

    // ── Token versioning (all roles) ────────────────────────────
    // Bumped on role change. JWT carries this value; verifyToken
    // rejects any token whose version doesn't match the DB.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────────────────
// Institution-scoped queries (admin analytics, counsellor matching)
userSchema.index({ institution: 1 });
userSchema.index({ institution: 1, course: 1 });
// Role-based listings used by admin dashboard
userSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model('User', userSchema);