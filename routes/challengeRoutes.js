// routes/challengeRoutes.js

import express from "express";
import Challenge from "../models/Challenge.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const challenges = await Challenge.find(); // fetch all challenges
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: "Failed to fetch challenges." });
  }
});

export default router;
