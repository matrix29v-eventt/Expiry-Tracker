import mongoose from "mongoose";

const notificationPreferencesSchema = new mongoose.Schema(
  {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    countryCode: {
      type: String,
      trim: true,
      default: "91",
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({ email: true, whatsapp: false }),
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
