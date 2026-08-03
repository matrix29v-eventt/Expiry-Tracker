import express from "express";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";
import {
  getStats,
  listUsers,
  updateUser,
  deleteUser,
  listProducts,
  listNotifications,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/stats", getStats);
router.get("/users", listUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/products", listProducts);
router.get("/notifications", listNotifications);

export default router;
