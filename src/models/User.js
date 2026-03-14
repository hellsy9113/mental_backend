const mongoose = require('mongoose');

const ROLES = ['student', 'counsellor', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6
    },

    role: {
      type: String,
      enum: { values: ROLES, message: 'Role must be student, counsellor, or admin' },
      default: 'student'
    },

    bio:         { type: String, default: '', maxlength: 300 },
    avatarColor: { type: String, default: '' },

    institution:     { type: String, default: '', trim: true, maxlength: 150 },
    course:          { type: String, default: '', trim: true, maxlength: 100 },
    courseStartYear: { type: Number, default: null, min: 1980, max: 2100 },

    // ── Profile completion ───────────────────────────────────────────────
    // Default TRUE — safe for existing users whose documents predate this field.
    // New students are explicitly set to false in registerUser() so they go
    // through the first-login setup flow.
    profileComplete: { type: Boolean, default: true },

    // ── Token version ────────────────────────────────────────────────────
    // Incremented whenever a role change or forced logout is needed.
    // The JWT embeds this value at login; verifyToken compares them on every
    // request. A mismatch means the token is stale → 401, user must re-login.
    // Lightweight alternative to a token blacklist — no Redis/DB reads needed
    // EXCEPT on the one request after a role change (which is rare).
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

userSchema.index({ institution: 1 });
userSchema.index({ institution: 1, course: 1 });

module.exports = mongoose.model('User', userSchema);