import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: [
      "Energy Conservation",
      "Water Conservation",
      "Waste Reduction",
      "Sustainable Transport",
      "Green Living",
    ],
    required: true,
  },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  target: { type: String },
  participants: { type: Number, default: 0 },
  impactMetric: { type: String },
  createdBy: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  imageUrl: { type: String },
});

const Challenge = mongoose.model("Challenge", challengeSchema);

export default Challenge;
