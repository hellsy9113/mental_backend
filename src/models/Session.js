const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    counsellorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Denormalised for fast admin queries per institution
    institution: {
      type: String,
      default: '',
      trim: true,
      index: true
    },

    scheduledAt: {
      type: Date,
      required: true
    },

    durationMinutes: {
      type: Number,
      default: 50,
      min: 15,
      max: 180
    },

    type: {
      type: String,
      enum: ['video', 'chat', 'in-person', 'phone'],
      default: 'video'
    },

    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },

    notes: {
      type: String,
      default: '',
      maxlength: 2000
    },

    // Post-session summary visible to both parties (optional)
    summary: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Compound index: admin can query all sessions for an institution
sessionSchema.index({ institution: 1, scheduledAt: -1 });
// Counsellor's own sessions sorted by date
sessionSchema.index({ counsellorId: 1, scheduledAt: -1 });
// Student's session history
sessionSchema.index({ studentId: 1, scheduledAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);