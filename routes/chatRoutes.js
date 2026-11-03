import express from "express";
import { getMessages, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/tickets/:ticketId/messages", protect, getMessages);
router.post("/tickets/:ticketId/messages", protect, sendMessage);

export default router;
