const mongoose = require('mongoose');

const counsellorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    specialization: {
      type: String,
      default: ''
    },

    bio: {
      type: String,
      default: ''
    },

    // Students assigned to this counsellor
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Availability slots e.g. [{ day: 'Monday', startTime: '10:00', endTime: '12:00' }]
    availability: [
      {
        day: { type: String },
        startTime: { type: String },
        endTime: { type: String }
      }
    ],

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CounsellorProfile', counsellorProfileSchema);
