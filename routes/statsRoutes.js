import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Schema
const statsSchema = new mongoose.Schema({
  title: String,
  value: Number,
  unit: String,
  icon: String
});

// Model
const Stat = mongoose.model("Stat", statsSchema);

// GET all stats
router.get("/", async (req, res) => {
  try {
    const stats = await Stat.find();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
