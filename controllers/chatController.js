import mongoose from "mongoose";
import Message from "../models/Message.js";
import Ticket from "../models/Ticket.js";

const validChatTypes = ["client_admin", "admin_developer"];

const getAccessibleTicket = async (ticketId, chatType, user) => {
  if (!validChatTypes.includes(chatType)) {
    return { error: { status: 400, message: "Valid chatType is required (client_admin or admin_developer)" } };
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return { error: { status: 404, message: "Ticket not found" } };

  const userId = user._id.toString();
  const ownsTicket = ticket.client.toString() === userId;
  const isAssignedDeveloper = ticket.assignedDeveloper?.toString() === userId;

  if (
    (user.role === "client" && (chatType !== "client_admin" || !ownsTicket)) ||
    (user.role === "developer" && (chatType !== "admin_developer" || !isAssignedDeveloper)) ||
    (user.role === "admin" && chatType === "admin_developer" && !ticket.assignedDeveloper)
  ) {
    return { error: { status: 403, message: "You cannot access this ticket conversation" } };
  }

  if (!["client", "developer", "admin"].includes(user.role)) {
    return { error: { status: 403, message: "You cannot access chat" } };
  }

  return { ticket };
};

export const getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { chatType } = req.query;

    if (!mongoose.isValidObjectId(ticketId)) {
      return res.status(400).json({ success: false, message: "Invalid ticket ID" });
    }

    const access = await getAccessibleTicket(ticketId, chatType, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ success: false, message: access.error.message });
    }

    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const messages = await Message.find({ ticket: ticketId, chatType })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      ticket: { _id: access.ticket._id, title: access.ticket.title },
      chatType,
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error("Fetch chat messages failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to fetch chat messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { chatType } = req.query;
    const text = req.body.text?.trim();

    if (!mongoose.isValidObjectId(ticketId)) {
      return res.status(400).json({ success: false, message: "Invalid ticket ID" });
    }

    if (!text || text.length > 5000) {
      return res.status(400).json({ success: false, message: "Message must be between 1 and 5000 characters" });
    }

    const access = await getAccessibleTicket(ticketId, chatType, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ success: false, message: access.error.message });
    }

    const message = await Message.create({
      ticket: access.ticket._id,
      chatType,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text,
    });

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Send chat message failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to send chat message" });
  }
};
