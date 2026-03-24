require('dotenv').config(); 
const http            = require('http');
const app             = require('./app');
const connectDB       = require('./config/db');
const { initSocket }  = require('./socket');


if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment variables');
  process.exit(1);
}

const fs = require('fs');
fs.appendFileSync('startup.log', `[${new Date().toISOString()}] Server process start. MONGO_URL ENV: ${process.env.MONGO_URL ? 'PRESENT' : 'MISSING'}\n`);
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    const maskedUri = process.env.MONGO_URL ? process.env.MONGO_URL.replace(/:([^@]+)@/, ':****@') : 'MISSING';
    console.log(`Starting server with MONGO_URL: ${maskedUri}`);
    await connectDB();
   

    // Create HTTP server from Express app
    // Must use http.createServer — Socket.io attaches here, not to app directly
    const server = http.createServer(app);

    // Attach Socket.io signalling to the same HTTP server + port
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();