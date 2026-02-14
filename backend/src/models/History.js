import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["added", "deleted", "expired", "updated"],
      required: true,
    },
    category: String,
    expiryDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model("History", historySchema);
