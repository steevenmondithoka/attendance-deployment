const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require("socket.io");

// Import models for dashboard stats
const User = require('./models/User');
const Class = require('./models/Class');
const Student = require('./models/Student');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// --- ✅ CORS setup for both local & deployed frontend ---
const FRONTEND_URLS = [
  'https://attendance-deployment-three.vercel.app', // production
  'http://localhost:5173' // local development
];
app.use(cors({
  origin: FRONTEND_URLS,
  credentials: true
}));

// --- ✅ Create HTTP server and attach Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URLS,
    methods: ["GET", "POST"]
  }
});

// --- ✅ Dashboard data emitter function ---
const emitDashboardData = async () => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await Student.countDocuments();
    const totalClasses = await Class.countDocuments();

    io.emit("dashboard_update", {
      stats: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalClasses
      },
      latestActivity: {
        action: `System stats refreshed`,
        user: 'System',
        time: new Date().toLocaleTimeString()
      }
    });

    console.log('✅ Dashboard data emitted successfully.');
  } catch (error) {
    console.error("❌ Error emitting dashboard data:", error);
  }
};

// --- ✅ Socket.IO connection events ---
io.on('connection', (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// --- ✅ Root route for Render health check ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Attendance Backend is Live 🎉 and Socket.IO is attached.'
  });
});

// Handle favicon requests quietly
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- ✅ Attach Socket.IO emitter BEFORE routers ---
app.use((req, res, next) => {
  req.io = io;
  req.emitDashboardData = emitDashboardData;
  next();
});

// --- ✅ Mount all routers ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/class', require('./routes/class'));
app.use('/api/students', require('./routes/student'));
app.use('/api/attendance', require('./routes/attendance'));

// --- ✅ 404 Fallback handler ---
app.use((req, res) => {
  console.log(`404 Error: Unhandled Request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    msg: `Resource not found: ${req.originalUrl}`
  });
});

// --- ✅ Start the server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
