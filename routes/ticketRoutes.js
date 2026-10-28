
import express from "express";

import {
  createTicket,
  getTickets,
  getTicketById,
  assignDeveloper,
  reviewTicket,
  updateTicketStatus,
  deleteTicket,
} from "../controllers/ticketController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Client: create ticket
router.post(
  "/",
  protect,
  authorizeRoles("client"),
  createTicket
);

// Admin: all tickets
// Client: own tickets
// Developer: assigned tickets
router.get(
  "/",
  protect,
  authorizeRoles("admin", "client", "developer"),
  getTickets
);

// View ticket details
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "client", "developer"),
  getTicketById
);

// Admin: assign developer
router.patch(
  "/:id/assign",
  protect,
  authorizeRoles("admin"),
  assignDeveloper
);

router.patch(
  "/:id/review",
  protect,
  authorizeRoles("admin"),
  reviewTicket
);

// Assigned developer: update ticket status
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("developer"),
  updateTicketStatus
);

// Admin: delete ticket
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteTicket
);

export default router;
