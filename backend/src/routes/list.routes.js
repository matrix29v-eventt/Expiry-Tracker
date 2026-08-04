import express from "express";
import crypto from "crypto";
import List from "../models/List.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import History from "../models/History.js";
import { protect } from "../middleware/auth.middleware.js";
import { sendEmail, layout } from "../services/email.service.js";
import { memberRole, canView, canEdit } from "../utils/listPermissions.js";

const router = express.Router();

const getList = (id) => List.findById(id).populate("members.user", "name email");

/* GET ALL LISTS (owned or member) */
router.get("/", protect, async (req, res) => {
  try {
    const lists = await List.find({
      $or: [{ user: req.userId }, { "members.user": req.userId }],
    }).populate("members.user", "name email");
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET PENDING INVITES FOR CURRENT USER */
router.get("/me/invites", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const lists = await List.find({ "invites.email": user.email }).populate("user", "name email");

    const invites = lists.flatMap((list) =>
      (list.invites || [])
        .filter((inv) => inv.email === user.email)
        .map((inv) => ({
          listId: list._id,
          listName: list.name,
          invitedBy: list.user?.name || "Someone",
          role: inv.role,
          token: inv.token,
        }))
    );

    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* CREATE LIST */
router.post("/", protect, async (req, res) => {
  try {
    const list = await List.create({
      name: req.body.name,
      user: req.userId,
    });
    res.status(201).json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* ACCEPT INVITE */
router.post("/accept-invite", protect, async (req, res) => {
  try {
    const { token } = req.body;
    const list = await List.findOne({ "invites.token": token });
    if (!list) {
      return res.status(404).json({ message: "Invite not found or already used" });
    }

    const user = await User.findById(req.userId);
    const invite = (list.invites || []).find((inv) => inv.token === token);
    if (!invite || invite.email !== user.email) {
      return res.status(403).json({ message: "This invite belongs to a different account" });
    }

    const member = (list.members || []).find((m) => String(m.user) === String(req.userId));
    if (member) {
      member.role = invite.role;
    } else {
      list.members.push({ user: req.userId, role: invite.role, addedBy: list.user });
    }
    list.invites = list.invites.filter((inv) => inv.token !== token);
    await list.save();

    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* GET SINGLE LIST */
router.get("/:id", protect, async (req, res) => {
  try {
    const list = await getList(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    const role = memberRole(list, req.userId);
    if (!canView(role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json({ ...list.toObject(), role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE LIST (owner) */
router.delete("/:id", protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (memberRole(list, req.userId) !== "owner") {
      return res.status(403).json({ message: "Owner access required" });
    }
    await Product.deleteMany({ list: req.params.id });
    await list.deleteOne();
    res.json({ message: "List deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* INVITE MEMBER BY EMAIL (owner) */
router.post("/:id/invite", protect, async (req, res) => {
  try {
    const { email, role = "editor" } = req.body;
    const list = await getList(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (memberRole(list, req.userId) !== "owner") {
      return res.status(403).json({ message: "Owner access required" });
    }

    const target = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!target) {
      return res.status(404).json({ message: "No account found for that email" });
    }

    const member = (list.members || []).find((m) => String(m.user) === String(target._id));
    if (member) {
      member.role = role;
    } else {
      const invite = (list.invites || []).find((inv) => inv.email === target.email);
      if (invite) {
        invite.role = role;
      } else {
        list.invites.push({
          email: target.email,
          role,
          token: crypto.randomBytes(24).toString("hex"),
        });
      }
    }
    await list.save();

    const inviter = await User.findById(req.userId);
    const pending = (list.invites || []).find((inv) => inv.email === target.email);
    if (pending) {
      const acceptUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/lists`;
      const html = layout(
        `You're invited to "${list.name}"`,
        `
        <p style="color:#374151;font-size:15px;line-height:1.6;">Hi ${target.name},</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;"><strong>${inviter?.name || "Someone"}</strong> invited you to the pantry list <strong>"${list.name}"</strong> as an <strong>${pending.role}</strong>.</p>
        <a href="${acceptUrl}" style="display:inline-block;margin:16px 0;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
          View Invites
        </a>
        <p style="color:#6b7280;font-size:13px;">You'll need to be signed in to accept the invite.</p>
        `
      );
      await sendEmail({
        to: target.email,
        subject: `Invitation to "${list.name}" on ExpiryTracker`,
        html,
      });
    }

    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* CANCEL INVITE (owner) */
router.delete("/:id/invites/:email", protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (memberRole(list, req.userId) !== "owner") {
      return res.status(403).json({ message: "Owner access required" });
    }
    list.invites = list.invites.filter(
      (inv) => inv.email !== String(req.params.email).toLowerCase()
    );
    await list.save();
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* GENERATE SHARE LINK (owner) */
router.post("/:id/share-link", protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (memberRole(list, req.userId) !== "owner") {
      return res.status(403).json({ message: "Owner access required" });
    }
    if (!list.shareToken) {
      list.shareToken = crypto.randomBytes(24).toString("hex");
      await list.save();
    }
    res.json({
      shareUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/lists/${list._id}?join=${list.shareToken}`,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* JOIN VIA SHARE LINK (viewer) */
router.post("/:id/join", protect, async (req, res) => {
  try {
    const { token } = req.body;
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (!list.shareToken || list.shareToken !== token) {
      return res.status(403).json({ message: "Invalid share link" });
    }
    if (!memberRole(list, req.userId)) {
      list.members.push({ user: req.userId, role: "viewer", addedBy: list.user });
      await list.save();
    }
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* CHANGE MEMBER ROLE (owner) */
router.put("/:id/members/:userId", protect, async (req, res) => {
  try {
    const { role } = req.body;
    const list = await getList(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (memberRole(list, req.userId) !== "owner") {
      return res.status(403).json({ message: "Owner access required" });
    }
    const member = (list.members || []).find((m) => String(m.user) === String(req.params.userId));
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    member.role = role;
    await list.save();
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* REMOVE MEMBER (owner) */
router.delete("/:id/members/:userId", protect, async (req, res) => {
  try {
    const list = await getList(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (memberRole(list, req.userId) !== "owner") {
      return res.status(403).json({ message: "Owner access required" });
    }
    if (String(req.params.userId) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot remove yourself" });
    }
    list.members = list.members.filter((m) => String(m.user) !== String(req.params.userId));
    await list.save();
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* GET PRODUCTS IN LIST (owner, editor, viewer) */
router.get("/:id/products", protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (!canView(memberRole(list, req.userId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const products = await Product.find({ list: list._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ADD PRODUCT TO LIST (owner or editor) */
router.post("/:id/products", protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (!canEdit(memberRole(list, req.userId))) {
      return res.status(403).json({ message: "Editor access required" });
    }

    const product = await Product.create({
      name: req.body.name,
      expiryDate: req.body.expiryDate,
      category: req.body.category || "",
      quantity: req.body.quantity || 1,
      unit: req.body.unit || "",
      imageUrl: req.body.imageUrl,
      user: req.userId,
      list: list._id,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* UPDATE PRODUCT IN LIST (owner or editor) */
router.put("/:id/products/:productId", protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (!canEdit(memberRole(list, req.userId))) {
      return res.status(403).json({ message: "Editor access required" });
    }

    const product = await Product.findOne({ _id: req.params.productId, list: list._id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, {
      name: req.body.name ?? product.name,
      category: req.body.category ?? product.category,
      expiryDate: req.body.expiryDate ?? product.expiryDate,
      quantity: req.body.quantity ?? product.quantity,
      unit: req.body.unit ?? product.unit,
      imageUrl: req.body.imageUrl ?? product.imageUrl,
    });
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* DELETE PRODUCT IN LIST (owner or editor) */
router.delete("/:id/products/:productId", protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (!canEdit(memberRole(list, req.userId))) {
      return res.status(403).json({ message: "Editor access required" });
    }

    const product = await Product.findOne({ _id: req.params.productId, list: list._id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await History.create({
      user: req.userId,
      productName: product.name,
      action: "deleted",
      category: product.category,
      expiryDate: product.expiryDate,
    });
    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
