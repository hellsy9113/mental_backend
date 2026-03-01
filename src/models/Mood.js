const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Performance index (important)
moodSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Mood", moodSchema);
