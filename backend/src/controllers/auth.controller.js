import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const createToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/* REGISTER */
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
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
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({ message: "Registration successful" });
};
/* LOGOUT */
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false // true in production (HTTPS)
  });

  res.status(200).json({ message: "Logged out successfully" });
};

/* LOGIN */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validation
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

  const token = createToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // true in production
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ message: "Login successful" });
};
