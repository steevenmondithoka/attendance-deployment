const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http'); // 1. Import http
const { Server } = require("socket.io"); // 2. Import socket.io

// --- Import your models for fetching stats ---
const User = require('./models/User');
const Class = require('./models/Class');
const Student = require('./models/Student');


// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());

// Enable CORS for standard API requests
const VERCEL_FRONTEND_URL = 'https://attendance-deployment-eta.vercel.app'; 

app.use(cors({ origin: VERCEL_FRONTEND_URL, credentials: true }));



// --- 3. REAL-TIME SOCKET.IO SETUP ---
const server = http.createServer(app); // Create an HTTP server from your Express app

// Attach Socket.IO to the server with CORS configuration
const io = new Server(server, {
    cors: { origin: VERCEL_FRONTEND_URL, methods: ["GET", "POST"] }
});

// This function fetches fresh data and broadcasts it to all connected clients.
const emitDashboardData = async () => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalStudents = await Student.countDocuments(); // Use Student model for accurate count
        const totalClasses = await Class.countDocuments();

        // The event name 'dashboard_update' must match what the client is listening for
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
        console.log('Dashboard data emitted successfully.');
    } catch (error) {
        console.error("Error emitting dashboard data:", error);
    }
};

// Listen for new client connections
io.on('connection', (socket) => {
  console.log(`User connected with socket ID: ${socket.id}`);
  
  // Immediately send the latest data to a newly connected user
  emitDashboardData();

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// 4. Middleware to make the emitter function available in all routes
// This MUST be placed BEFORE you mount your routers.
app.use((req, res, next) => {
    req.io = io; // You can also attach the whole io instance if needed
    req.emitDashboardData = emitDashboardData;
    next();
});


// Mount Routers (These remain unchanged)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/class', require('./routes/class'));
app.use('/api/students', require('./routes/student'));
app.use('/api/attendance', require('./routes/attendance'));

app.use((req, res, next) => {
    // Log the exact path that failed to help debug
    console.log(`404 Error: Unhandled Request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, msg: `The requested resource was not found on this server. Path: ${req.originalUrl}` });
});
const PORT = process.env.PORT || 5000;

// 5. Start the server using the http instance, NOT app.listen()
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));