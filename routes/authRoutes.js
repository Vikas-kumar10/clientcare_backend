import express from "express";
import {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", authMiddleware, getMyProfile);
router.patch("/profile", authMiddleware, updateMyProfile);

export default router;