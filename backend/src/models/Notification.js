import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "error", "expiry"],
      default: "info",
    },
    channel: {
      type: String,
      enum: ["inapp", "email", "whatsapp", "push"],
      default: "inapp",
    },
    deliveredAt: {
      type: Date,
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, product: 1, channel: 1 });

export default mongoose.model("Notification", notificationSchema);
