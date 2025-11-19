import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Schema
const statsSchema = new mongoose.Schema({
  title: String,
  value: Number,
  unit: String,
  icon: String
}, { timestamps: true });

// Model
const Stat = mongoose.model("Stat", statsSchema);

// 🔍 Debug route - Check database connection and data
router.get("/debug", async (req, res) => {
  try {
    const count = await Stat.countDocuments();
    const allStats = await Stat.find().lean();
    res.json({
      success: true,
      message: "Debug info",
      database: {
        connected: mongoose.connection.readyState === 1,
        name: mongoose.connection.name,
        host: mongoose.connection.host
      },
      stats: {
        total: count,
        data: allStats
      }
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ 
      success: false,
      message: "Debug failed", 
      error: err.message 
    });
  }
});

// GET all stats
router.get("/", async (req, res) => {
  try {
    const stats = await Stat.find().sort({ createdAt: -1 });
    console.log(`📊 Stats found: ${stats.length}`);
    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

// POST - Create new stat
router.post("/", async (req, res) => {
  try {
    const { title, value, unit, icon } = req.body;
    
    // Validation
    if (!title || value === undefined) {
      return res.status(400).json({ message: "Title and value are required" });
    }

    const newStat = new Stat({ title, value, unit, icon });
    const saved = await newStat.save();
    console.log("✅ Stat created:", saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating stat:", err);
    res.status(500).json({ message: "Failed to create stat", error: err.message });
  }
});

// POST - Seed initial data (for testing)
router.post("/seed", async (req, res) => {
  try {
    // Check if data already exists
    const count = await Stat.countDocuments();
    if (count > 0) {
      return res.json({ message: "Stats already exist", count });
    }

    const sampleStats = [
      { title: "Trees Planted", value: 15420, unit: "+", icon: "🌳" },
      { title: "CO₂ Reduced", value: 8540, unit: "kg", icon: "🌍" },
      { title: "Active Users", value: 2150, unit: "+", icon: "👥" },
      { title: "Challenges Completed", value: 3200, unit: "+", icon: "🏆" }
    ];

    const inserted = await Stat.insertMany(sampleStats);
    console.log("✅ Sample stats seeded:", inserted.length);
    res.status(201).json({ 
      message: "Sample stats created successfully", 
      count: inserted.length,
      data: inserted 
    });
  } catch (err) {
    console.error("Error seeding stats:", err);
    res.status(500).json({ message: "Failed to seed stats", error: err.message });
  }
});

// DELETE all stats (for testing)
router.delete("/clear", async (req, res) => {
  try {
    const result = await Stat.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} stats`);
    res.json({ message: "All stats deleted", deletedCount: result.deletedCount });
  } catch (err) {
    console.error("Error clearing stats:", err);
    res.status(500).json({ message: "Failed to clear stats", error: err.message });
  }
});

export default router;