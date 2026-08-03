import User from "../models/User.js";
import Product from "../models/Product.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  countryCode: user.countryCode || "91",
  notificationPreferences: user.notificationPreferences || { email: true, whatsapp: false },
  createdAt: user.createdAt,
});

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const productCount = await Product.countDocuments({ user: user._id });

    res.json({ ...publicUser(user), productCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, phone, countryCode, notificationPreferences } = req.body;

    const update = {};
    if (typeof name === "string" && name.trim()) update.name = name.trim();
    if (typeof phone === "string") update.phone = phone.trim();
    if (typeof countryCode === "string") update.countryCode = countryCode.replace(/\D/g, "");

    if (notificationPreferences && typeof notificationPreferences === "object") {
      const { email, whatsapp } = notificationPreferences;
      const prefs = {};
      if (typeof email === "boolean") prefs.email = email;
      if (typeof whatsapp === "boolean") prefs.whatsapp = whatsapp;
      update.notificationPreferences = prefs;
    }

    const user = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
