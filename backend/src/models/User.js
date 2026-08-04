import mongoose from "mongoose";

const notificationPreferencesSchema = new mongoose.Schema(
  {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
  },
  { _id: false }
);

const reminderPreferencesSchema = new mongoose.Schema(
  {
    warningDays: { type: Number, default: 7, min: 1, max: 30 },
    notifyOnExpiryDay: { type: Boolean, default: true },
  },
  { _id: false }
);

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: String,
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
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      sparse: true,
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
    reminderPreferences: {
      type: reminderPreferencesSchema,
      default: () => ({ warningDays: 7, notifyOnExpiryDay: true }),
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    pushSubscriptions: {
      type: [pushSubscriptionSchema],
      default: [],
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
