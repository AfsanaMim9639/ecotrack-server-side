// routes/challengeRoutes.js

import express from "express";
import Challenge from "../models/Challenge.js";

const router = express.Router();

// ==========================================
// GET /api/challenges/stats/summary - MUST be before /:id route
// ==========================================
router.get("/stats/summary", async (req, res) => {
  try {
    const totalChallenges = await Challenge.countDocuments();
    const activeChallenges = await Challenge.countDocuments({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    const categories = await Challenge.distinct("category");
    
    const totalParticipants = await Challenge.aggregate([
      { $group: { _id: null, total: { $sum: "$participants" } } }
    ]);

    res.json({
      success: true,
      data: {
        totalChallenges,
        activeChallenges,
        categories: categories.length,
        totalParticipants: totalParticipants[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch statistics",
      error: error.message 
    });
  }
});

// ==========================================
// GET /api/challenges - With advanced filtering
// ==========================================
router.get("/", async (req, res) => {
  try {
    console.log("📥 Request Query:", req.query);
    
    const { 
      search,
      category, 
      startDate, 
      endDate, 
      minParticipants, 
      maxParticipants,
      difficulty,
      sortBy,
      limit,
      page
    } = req.query;

    let filter = {};

    // ==========================================
    // 🔍 TEXT SEARCH - Search in multiple fields
    // ==========================================
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } },
        { target: { $regex: search.trim(), $options: "i" } },
        { impactMetric: { $regex: search.trim(), $options: "i" } }
      ];
    }

    // ==========================================
    // 📁 CATEGORY FILTER - Using $in operator
    // Support multiple categories: "Waste Reduction,Energy Conservation"
    // ==========================================
    if (category && category.trim()) {
      const categories = category.split(",").map(c => c.trim());
      filter.category = { $in: categories };
      console.log("📁 Category Filter:", categories);
    }

    // ==========================================
    // 🎯 DIFFICULTY FILTER
    // ==========================================
    if (difficulty && difficulty.trim()) {
      filter.difficulty = difficulty.trim();
      console.log("🎯 Difficulty Filter:", difficulty.trim());
    }

    // ==========================================
    // 📅 DATE RANGE FILTER - Using $gte and $lte
    // Filter challenges by startDate range
    // ==========================================
    if (startDate || endDate) {
      filter.startDate = {};
      
      if (startDate && startDate.trim()) {
        filter.startDate.$gte = new Date(startDate);
        console.log("📅 Start Date (gte):", new Date(startDate));
      }
      
      if (endDate && endDate.trim()) {
        filter.startDate.$lte = new Date(endDate);
        console.log("📅 End Date (lte):", new Date(endDate));
      }
    }

    // ==========================================
    // 👥 PARTICIPANTS RANGE FILTER - Using $gte and $lte
    // Example: minParticipants=10&maxParticipants=1000
    // ==========================================
    if (minParticipants || maxParticipants) {
      filter.participants = {};
      
      if (minParticipants && minParticipants.trim()) {
        const minValue = Number(minParticipants);
        if (!isNaN(minValue)) {
          filter.participants.$gte = minValue;
          console.log("👥 Min Participants (gte):", minValue);
        }
      }
      
      if (maxParticipants && maxParticipants.trim()) {
        const maxValue = Number(maxParticipants);
        if (!isNaN(maxValue)) {
          filter.participants.$lte = maxValue;
          console.log("👥 Max Participants (lte):", maxValue);
        }
      }
    }

    console.log("🔍 Final MongoDB Filter:", JSON.stringify(filter, null, 2));

    // ==========================================
    // 📊 SORTING
    // ==========================================
    let sort = {};
    switch (sortBy) {
      case "popularity":
        sort = { participants: -1 };
        break;
      case "date":
        sort = { startDate: -1 };
        break;
      case "participants":
        sort = { participants: -1 };
        break;
      case "duration":
        sort = { duration: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    console.log("📊 Sort:", sort);

    // ==========================================
    // 📄 PAGINATION
    // ==========================================
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 100;
    const skip = (pageNumber - 1) * limitNumber;

    console.log("📄 Pagination:", { page: pageNumber, limit: limitNumber, skip });

    // ==========================================
    // 🔎 FETCH CHALLENGES FROM MONGODB
    // ==========================================
    const challenges = await Challenge.find(filter)
      .sort(sort)
      .limit(limitNumber)
      .skip(skip);

    console.log(`✅ Found ${challenges.length} challenges matching filters`);

    // Get total count for pagination
    const totalChallenges = await Challenge.countDocuments(filter);
    const totalPages = Math.ceil(totalChallenges / limitNumber);

    console.log(`📊 Total: ${totalChallenges} challenges, ${totalPages} pages`);

    // ==========================================
    // 📤 SEND RESPONSE
    // ==========================================
    res.json({
      success: true,
      data: challenges,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalChallenges,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      },
      appliedFilters: {
        search: search || null,
        category: category || null,
        difficulty: difficulty || null,
        startDate: startDate || null,
        endDate: endDate || null,
        minParticipants: minParticipants || null,
        maxParticipants: maxParticipants || null,
        sortBy: sortBy || "date"
      }
    });

  } catch (error) {
    console.error("❌ Error fetching challenges:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch challenges.",
      error: error.message 
    });
  }
});

// ==========================================
// GET /api/challenges/:id - Get single challenge
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ 
        success: false,
        message: "Challenge not found" 
      });
    }

    res.json({
      success: true,
      data: challenge
    });
  } catch (error) {
    console.error("❌ Error fetching challenge:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch challenge",
      error: error.message 
    });
  }
});

// ==========================================
// POST /api/challenges/join/:id - Join a challenge
// ==========================================
router.post("/join/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const challengeId = req.params.id;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({ 
        success: false,
        message: "Challenge not found" 
      });
    }

    // Increment participants count
    challenge.participants += 1;
    await challenge.save();

    res.json({
      success: true,
      message: "Successfully joined the challenge!",
      data: challenge
    });
  } catch (error) {
    console.error("❌ Error joining challenge:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to join challenge",
      error: error.message 
    });
  }
});

export default router;