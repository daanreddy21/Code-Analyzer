// server.js
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const runRoutes = require("./routes/runRoutes");
const http = require("http");
const app = express();
const server = http.createServer(app);

// ROUTES
const authRoutes = require("./routes/authRoutes");
const codeRoutes = require("./routes/codeRoutes");
const projectRoutes = require("./routes/projectSubmission");
const fileRoutes = require("./routes/fileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const explainRoutes = require("./routes/explainRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const reminderJob = require("./jobs/reminderJob");
const commentRoutes = require("./routes/commentRoutes");
const predictRoutes = require("./routes/predictRoutes");



// ✅ Create directories
const ensureDirectories = () => {
  const dirs = ['uploads', 'temp', 'uploads/profiles'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};


// 🔹 FIXED CORS
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// OPTIONS preflight
app.options('*', cors());

// Security
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "http://localhost:5000", "data:", "images/*"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 10000, // 10 minutes
  max: 200,
  message: { error: 'Too many requests, please wait a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', (req, res, next) => {
  if (req.path === '/health') return next();
  limiter(req, res, next);
});

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'image/png,image/jpeg,image/webp,image/gif');
  }
}));

app.use("/uploads/profiles", express.static(path.join(__dirname, "uploads/profiles"), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'image/png,image/jpeg,image/webp,image/gif');
  }
}));

app.use(express.json({ limit: '10mb' }));  // Parses JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parses form data

// Init dirs
ensureDirectories();

// Health & root
app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));
app.get("/", (req, res) => res.json({ message: "🚀 Profile + Images Ready!" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/explain", explainRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/run", runRoutes);
app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/predict", predictRoutes);







// 404
app.use("*", (req, res) => res.status(404).json({ error: "Route not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: "Server error" });
});


// ✅ Socket.IO on the same server that listens on 5000
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],  // ✅ Explicit transports
  allowEIO3: true  // ✅ Allow older Engine.IO v3 clients
});

global.io = io; 

io.on("connection", (socket) => {
  
  console.log("Socket connected", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  // 🔥 COMMENT ROOM JOIN
socket.on("join_submission", (submissionId) => {
  socket.join(`submission_${submissionId}`);
  console.log("Joined submission room:", submissionId);
});


  socket.on("typing", ({ receiverId }) => {
    socket.to(receiverId).emit("typing");
  });


  socket.on("stopTyping", ({ receiverId }) => {
    socket.to(receiverId).emit("stopTyping");
  });


  socket.on("sendMessage", ({ receiverId, message, conversationId }) => {
    socket.to(receiverId).emit("newMessage", {
      message,
      conversationId,
      sender_id: socket.userId, // you can set this via auth middleware if you want
      is_read: false,
    });
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📱 Health: http://localhost:${PORT}/health`);
  console.log(`👤 Profile: http://localhost:${PORT}/api/user/profile`);
  console.log(`🖼️  Images: http://localhost:${PORT}/uploads/profiles/`);
  console.log(`✅ CORS enabled for images!`);
});