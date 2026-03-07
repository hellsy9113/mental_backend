const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema({
  title: String,
  artist: String,
  category: String,
  tags: [String],
  audioUrl: String,
  duration: Number,
  active: { type: Boolean, default: true }
});

musicSchema.index({
  title: "text",
  artist: "text",
  category: "text",
  tags: "text"
});

const Music = mongoose.model("Music", musicSchema);

module.exports = Music;