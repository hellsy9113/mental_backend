const mongoose = require('mongoose');

const counsellorNoteSchema = new mongoose.Schema(
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

    title: {
      type: String,
      default: '',
      maxlength: 200,
      trim: true
    },

    content: {
      type: String,
      required: true,
      maxlength: 10000
    },

    // Notes are PRIVATE — never exposed to student or admin
    // This field is intentional and enforced at service level
    isPrivate: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Fast lookup: all notes a counsellor wrote about a student
counsellorNoteSchema.index({ counsellorId: 1, studentId: 1, updatedAt: -1 });

module.exports = mongoose.model('CounsellorNote', counsellorNoteSchema);