
import express from "express";
import {
  createTicketActivity,
  getActivities,
} from "../controllers/activityController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getActivities);
router.post(
  "/tickets/:ticketId",
  authMiddleware,
  authorizeRoles("developer"),
  createTicketActivity
);

export default router;
