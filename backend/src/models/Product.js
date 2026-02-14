import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    category: String,
    imageUrl: String,
    isExpired: {
      type: Boolean,
      default: false,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // 🔴 IMPORTANT
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
