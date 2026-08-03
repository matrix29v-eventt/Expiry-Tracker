import User from "../models/User.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import History from "../models/History.js";
import { getPagination, paginateResponse } from "../utils/pagination.js";

export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [users, products, expired, notifications, notificationsWeek, unread, pending] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Product.countDocuments({ isExpired: true }),
        Notification.countDocuments(),
        Notification.countDocuments({ createdAt: { $gte: weekAgo } }),
        Notification.countDocuments({ isRead: false }),
        Notification.countDocuments({ deliveryStatus: "failed" }),
      ]);

    res.json({
      users,
      products,
      expired,
      notifications,
      notificationsWeek,
      unread,
      failedDeliveries: pending,
      recentUsers: await User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),
      recentProducts: await Product.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 20);

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).select("-password").skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    const userIds = users.map((user) => user._id);
    const productCounts = await Product.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    for (const row of productCounts) countMap[row._id] = row.count;

    const data = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      countryCode: user.countryCode,
      notificationPreferences: user.notificationPreferences,
      createdAt: user.createdAt,
      productCount: countMap[user._id] || 0,
    }));

    res.json(paginateResponse(data, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'admin'" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Promise.all([
      Product.deleteMany({ user: user._id }),
      Notification.deleteMany({ user: user._id }),
      History.deleteMany({ user: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);

    res.json({ message: "User and all associated data deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listProducts = async (req, res) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (status === "expired") filter.isExpired = true;
    if (status === "active") filter.isExpired = false;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("user", "name email")
        .sort({ expiryDate: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json(paginateResponse(products, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listNotifications = async (req, res) => {
  try {
    const { channel } = req.query;
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = {};
    if (channel) filter.channel = channel;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("user", "name email")
        .populate("product", "name expiryDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    res.json(paginateResponse(notifications, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
