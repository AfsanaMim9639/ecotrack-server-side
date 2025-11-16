import mongoose from "mongoose";

const tipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: "General" },
    author: { type: String, required: true },
    authorName: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true } // createdAt, updatedAt automatically
);

const Tip = mongoose.model("Tip", tipSchema);
export default Tip;
