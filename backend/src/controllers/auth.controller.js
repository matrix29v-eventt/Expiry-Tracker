import crypto from "crypto";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../services/email.service.js";

const VERIFICATION_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL = 60 * 60 * 1000; // 1h

const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

/* Promote user to admin if their email is in ADMIN_EMAILS */
const syncRole = async (user) => {
  if (getAdminEmails().includes(user.email) && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }
  return user;
};

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/* REGISTER */
export const registerUser = async (req, res) => {
  const { name, email, password, phone, countryCode, notificationPreferences } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  if (name.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters long" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone: phone || "",
    countryCode: countryCode || "91",
    notificationPreferences: notificationPreferences || { email: true, whatsapp: false },
    verificationToken,
    verificationTokenExpires: Date.now() + VERIFICATION_TOKEN_TTL,
  });

  await syncRole(user);

  const emailResult = await sendVerificationEmail({ to: user.email, token: verificationToken });
  if (!emailResult.ok) {
    console.warn("[auth] Verification email failed to send:", emailResult.error);
  }

  res.status(201).json({ message: "Registration successful. Please verify your email to log in." });
};

/* VERIFY EMAIL */
export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required" });
  }

  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification link" });
  }

  if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
    return res.status(400).json({ message: "Verification link has expired. Please request a new one." });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully. You can now log in." });
};

/* RESEND VERIFICATION */
export const resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.verificationToken = token;
  user.verificationTokenExpires = Date.now() + VERIFICATION_TOKEN_TTL;
  await user.save();

  const result = await sendVerificationEmail({ to: user.email, token });
  if (!result.ok) {
    return res.status(502).json({ message: "Failed to send verification email. Please try again later." });
  }

  res.json({ message: "Verification email sent. Check your inbox." });
};

/* FORGOT PASSWORD */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + RESET_TOKEN_TTL;
    await user.save();

    const result = await sendResetPasswordEmail({ to: user.email, token });
    if (!result.ok) {
      console.warn("[auth] Reset email failed to send:", result.error);
    }
  }

  res.json({ message: "If that email is registered, a reset link has been sent." });
};

/* RESET PASSWORD */
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  const user = await User.findOne({ resetPasswordToken: token });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset link" });
  }

  if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
    return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful. You can now log in." });
};

/* LOGOUT */
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production"
  });

  res.status(200).json({ message: "Logged out successfully" });
};

/* LOGIN */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  // Legacy accounts created before email verification existed have no
  // verificationToken set, so auto-verify them on first successful login.
  if (!user.isVerified && !user.verificationToken) {
    user.isVerified = true;
    await user.save();
  }

  if (!user.isVerified) {
    return res.status(403).json({
      message: "Please verify your email before logging in.",
      needsVerification: true,
    });
  }

  await syncRole(user);

  const token = createToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

/* GOOGLE LOGIN */
export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      user.googleId = googleId;
      if (!user.isVerified) {
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
        avatar: picture || "",
      });
    }

    await syncRole(user);

    const token = createToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[auth] Google verification failed:", error.message);
    return res.status(401).json({ message: "Invalid Google credential" });
  }
};
