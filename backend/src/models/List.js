import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["editor", "viewer"],
      default: "editor",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["editor", "viewer"],
      default: "editor",
    },
    token: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    invites: {
      type: [inviteSchema],
      default: [],
    },
    shareToken: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("List", listSchema);
