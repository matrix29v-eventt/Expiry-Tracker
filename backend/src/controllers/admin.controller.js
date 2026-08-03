import User from "../models/User.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import History from "../models/History.js";

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
    const users = await User.find().sort({ createdAt: -1 }).select("-password");

    const productCounts = await Product.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    for (const row of productCounts) countMap[row._id] = row.count;

    res.json(
      users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        countryCode: user.countryCode,
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt,
        productCount: countMap[user._id] || 0,
      }))
    );
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
    const filter = {};
    if (status === "expired") filter.isExpired = true;
    if (status === "active") filter.isExpired = false;

    const products = await Product.find(filter)
      .populate("user", "name email")
      .sort({ expiryDate: 1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listNotifications = async (req, res) => {
  try {
    const { channel } = req.query;
    const filter = {};
    if (channel) filter.channel = channel;

    const notifications = await Notification.find(filter)
      .populate("user", "name email")
      .populate("product", "name expiryDate")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
