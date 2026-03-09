const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/vyannaid'); // adjust if different
    const Mood = require('./src/models/Mood');
    const latest = await Mood.findOne().sort({ _id: -1 });
    console.log('Latest Mood:', latest);
    process.exit(0);
}

test();
