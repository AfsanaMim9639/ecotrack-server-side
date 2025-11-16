import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({});
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to load events", error });
  }
});

export default router;
