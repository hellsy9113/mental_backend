/**
 * models/Message.js
 *
 * Persistent direct message between a counsellor and a student.
 * Use Message.roomKey(idA, idB) to get a consistent socket room string.
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole:   { type: String, enum: ['counsellor', 'student'], required: true },
    senderName:   { type: String, default: '' },
    text:         { type: String, required: true, maxlength: 4000, trim: true },
    read:         { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for fast conversation fetching
messageSchema.index({ counsellorId: 1, studentId: 1, createdAt: 1 });

/**
 * Returns a stable DM socket room key for any counsellor-student pair.
 * Format: "dm:<smallerId>:<largerId>"
 */
messageSchema.statics.roomKey = function (idA, idB) {
  const [a, b] = [idA.toString(), idB.toString()].sort();
  return `dm:${a}:${b}`;
};

module.exports = mongoose.model('Message', messageSchema);