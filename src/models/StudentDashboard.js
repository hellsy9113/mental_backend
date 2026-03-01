// studentDashboardSchema.js
const mongoose = require("mongoose");

const studentDashboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    mentalStats: {
      moodScore: { type: Number, default: 0 },
      stressLevel: { type: Number, default: 0 },
      lastCheckIn: { type: Date }
    },
    

    goals: [
      {
        title: String,
        completed: { type: Boolean, default: false }
      }
    ],

    journalEntries: [
      {
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StudentDashboard",
  studentDashboardSchema
);
