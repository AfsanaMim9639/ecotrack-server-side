import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import statsRoutes from "./routes/statsRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import tipsRoutes from "./routes/tipsRoutes.js"; // ✅ import tips routes

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Test MongoDB connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// Routes
app.use("/api/challenges", challengeRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/tips", tipsRoutes); // ✅ add tips route

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
