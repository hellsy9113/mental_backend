const mongoose = require('mongoose');
const crypto = require('crypto');
const events = require('events');

// Global event emitter for journals (e.g. triggering worker)
const journalEvents = new events.EventEmitter();

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
    },

    // Embedding metadata encapsulated for future flexibility (e.g., chunking/separating)
    embeddingDetails: {
      vector: { type: [Number], default: [] }, // The actual vector from Gemini
      model: { type: String, default: null }, // Embedding model version (e.g. 'text-embedding-004')
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      }, // Embedding job status
      contentHash: { type: String, default: null }, // SHA256 of title + body to avoid re-embedding
      lastError: { type: String, default: null },
      retries: { type: Number, default: 0 },
      metadata: {
        emotion: { type: String, default: null },
        sentiment: { type: String, default: null },
        topics: { type: [String], default: [] }
      }
    }
  },
  {
    timestamps: true // createdAt, updatedAt handled automatically
  }
);

// Compound index: fast calendar queries — "all entries for user in month X"
journalSchema.index({ userId: 1, createdAt: -1 });

// Fast polling index for the worker query (avoids collection scans)
journalSchema.index({ 'embeddingDetails.status': 1 });

// Pre-save: keep wordCount in sync and reset embedding tracking if body/title changed
journalSchema.pre('save', async function () {
  // Sync word count
  if (this.isModified('body')) {
    this.wordCount = this.body.trim().split(/\s+/).filter(Boolean).length;
  }

  // Handle Embeddings Tracking safely
  if (this.isModified('title') || this.isModified('body')) {
    const rawText = `Title: ${this.title || ''}\nBody: ${this.body || ''}`;
    const hash = crypto.createHash('sha256').update(rawText).digest('hex');

    // Ensure the nested object exists before accessing it (e.g. for legacy documents)
    if (!this.embeddingDetails) {
      this.embeddingDetails = {};
    }

    // Only set to pending if we don't have a hash or the text changed
    if (this.embeddingDetails.contentHash !== hash) {
      this.embeddingDetails.contentHash = hash;
      this.embeddingDetails.status = 'pending';
      this.embeddingDetails.vector = [];
      this.embeddingDetails.retries = 0;
      this.embeddingDetails.lastError = null;
    }
  }
});

// Emit an event after save to trigger the worker immediately instead of waiting for cron
journalSchema.post('save', function (doc) {
  if (doc.embeddingDetails && doc.embeddingDetails.status === 'pending') {
    journalEvents.emit('journalPending', doc._id);
  }
});

const Journal = mongoose.model('Journal', journalSchema);

// Export both the model and the event emitter
module.exports = Journal;
module.exports.events = journalEvents;