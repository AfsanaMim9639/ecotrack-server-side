// api/challenges.js
import connectDB from "../utils/db.js";
import Challenge from "../models/Challenge.js";

export default async function handler(req, res) {
  await connectDB(); // connection reuse হবে

  if (req.method === "GET") {
    try {
      const challenges = await Challenge.find();
      res.status(200).json(challenges);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else if (req.method === "POST") {
    try {
      const newChallenge = new Challenge(req.body);
      const saved = await newChallenge.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
