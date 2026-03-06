
const mongoose = require('mongoose');

/**
 * Journal Entry Model
 *
 * Each document = one journal entry written by a student.
 * Kept as a standalone collection (not embedded in StudentDashboard)
 * so we can:
 *  - paginate / query by date efficiently
 *  - run a RAG pipeline over per-user entries in future
 *  - index the `body` field for full-text search later
 *
 * Timestamps: createdAt = first save, updatedAt = last edit
 */

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    title: {
      type: String,
      trim: true,
      default: 'Untitled Entry',
      maxlength: 200
    },

    body: {
      type: String,
      required: [true, 'Journal body cannot be empty'],
      trim: true
    },

    // Optional writing prompt that seeded this entry (for RAG context)
    prompt: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500
    },

    // Tags the student can optionally attach e.g. ['gratitude', 'anxiety']
    // Useful future RAG metadata
    tags: {
      type: [String],
      default: []
    },

    // Word count — stored so the RAG layer / analytics don't recompute it
    wordCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true // createdAt, updatedAt handled automatically
  }
);

// Compound index: fast calendar queries — "all entries for user in month X"
journalSchema.index({ userId: 1, createdAt: -1 });

// Pre-save: keep wordCount in sync
// Using async (no `next` parameter) — compatible with Mongoose 9.x
journalSchema.pre('save', async function () {
  if (this.isModified('body')) {
    this.wordCount = this.body.trim().split(/\s+/).filter(Boolean).length;
  }
});

module.exports = mongoose.model('Journal', journalSchema);