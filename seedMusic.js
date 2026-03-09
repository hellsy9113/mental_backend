const mongoose = require('mongoose');
require('dotenv').config();
const Music = require('./src/models/Music');

const sampleSongs = [
    {
        title: "Ethereal Drift",
        artist: "Lunar Dreams",
        category: "Ambient",
        tags: ["calm", "drifting", "ethereal"],
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: 372,
        active: true
    },
    {
        title: "Midnight Coffee",
        artist: "Lofi Girl",
        category: "Lofi",
        tags: ["relaxing", "study", "beats"],
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        duration: 425,
        active: true
    },
    {
        title: "Forest Rain",
        artist: "Nature Sounds",
        category: "Nature",
        tags: ["rain", "forest", "peaceful"],
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        duration: 300,
        active: true
    },
    {
        title: "Deep Focus",
        artist: "Piano Wonders",
        category: "Classical",
        tags: ["piano", "focus", "concentration"],
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        duration: 250,
        active: true
    },
    {
        title: "Sunlight Through Leaves",
        artist: "Acoustic Journeys",
        category: "Acoustic",
        tags: ["guitar", "warm", "gentle"],
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        duration: 280,
        active: true
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        // Optional: clear existing music if you want a clean start
        // await Music.deleteMany({});
        // console.log('Cleared existing music');

        await Music.insertMany(sampleSongs);
        console.log('Sample music seeded successfully!');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding music:', err);
        process.exit(1);
    }
}

seed();
