import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import statsRoutes from "./routes/statsRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import tipsRoutes from "./routes/tipsRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import admin from "firebase-admin";

dotenv.config();
const app = express();

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://eco-track-client-side.vercel.app',
  'https://eco-track-client-side-git-main.vercel.app',
  'https://eco-track-client-side-afsanamim9639.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Firebase Admin Initialization
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  console.log("✅ Firebase Admin initialized");
} catch (error) {
  console.error("❌ Firebase Admin initialization error:", error.message);
}

// MongoDB Atlas connection
let cached = globalThis.mongoose;
if (!cached) cached = globalThis.mongoose = { conn: null, promise: null };

const connectDB = async () => {
  if (cached.conn) {
    console.log("⚡ Using existing MongoDB connection");
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not defined");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      console.log("📊 Database:", mongoose.connection.name);
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

// 🔥 CRITICAL: Connect to DB immediately
connectDB().catch(err => console.error("❌ Initial DB connection failed:", err));

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// 🔥 MIDDLEWARE: Ensure DB connection before each request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("❌ DB Connection Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Database connection failed", 
      error: error.message 
    });
  }
});

// Middleware to verify Firebase token
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    message: "🌿 EcoTrack Backend is running!",
    status: "active",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// 🔥 API Routes - MUST be after DB middleware
app.use("/api/stats", statsRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/tips", tipsRoutes);
app.use("/api/events", eventRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ 
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export for Vercel
export default app;