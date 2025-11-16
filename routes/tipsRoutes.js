import express from "express";
import Tip from "../models/Tip.js";

const router = express.Router();

// GET /api/tips - fetch all tips
router.get("/", async (req, res) => {
  try {
    const tips = await Tip.find().sort({ createdAt: -1 }).limit(6); // recent 6 tips
    res.json(tips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
