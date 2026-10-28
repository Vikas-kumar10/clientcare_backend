
import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { createActivity } from "./activityController.js";

const validStatuses = [
  "Open",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
];

const validPriorities = ["Low", "Medium", "High", "Critical"];

const populateTicket = (query) =>
  query
    .populate("project", "name status")
    .populate("client", "name email")
    .populate("assignedDeveloper", "name email");

// CREATE TICKET — Client
export const createTicket = async (req, res) => {
  try {
    const { title, description, project, priority } = req.body;

    if (!title?.trim() || !description?.trim() || !project) {
      return res.status(400).json({
        success: false,
        message: "Title, description and project are required",
      });
    }

    if (!mongoose.isValidObjectId(project)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket priority",
      });
    }

    const projectExists = await Project.findOne({
      _id: project,
      client: req.user._id,
    });

    if (!projectExists) {
      return res.status(403).json({
        success: false,
        message: "You cannot create a ticket for this project",
      });
    }

    const ticket = await Ticket.create({
      title,
      description,
      project,
      client: req.user._id,
      createdBy: req.user._id,
      priority: priority || "Medium",
      status: "Open",
    });

    await createActivity({
      actor: req.user._id,
      action: "Ticket created",
      description: `You reported: ${ticket.title}`,
      entityType: "Ticket",
      ticket: ticket._id,
      project: ticket.project,
    });

    const result = await populateTicket(
      Ticket.findById(ticket._id)
    );

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET TICKETS — Role-based listing
export const getTickets = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "client") {
      filter.client = req.user._id;
    } else if (req.user.role === "developer") {
      filter.assignedDeveloper = req.user._id;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const tickets = await populateTicket(
      Ticket.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE TICKET
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await populateTicket(Ticket.findById(id));

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const userId = req.user._id.toString();

    const isClientOwner =
      ticket.client._id.toString() === userId;

    const isAssignedDeveloper =
      ticket.assignedDeveloper?._id.toString() === userId;

    if (
      req.user.role === "client" && !isClientOwner ||
      req.user.role === "developer" && !isAssignedDeveloper
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this ticket",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ASSIGN DEVELOPER — Admin
export const assignDeveloper = async (req, res) => {
  try {
    const { id } = req.params;
    const { developerId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    if (!mongoose.isValidObjectId(developerId)) {
      return res.status(400).json({
        success: false,
        message: "Valid developer ID is required",
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (["Resolved", "Closed"].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign a resolved or closed ticket",
      });
    }

    const developer = await User.findOne({
      _id: developerId,
      role: "developer",
    });

    if (!developer) {
      return res.status(400).json({
        success: false,
        message: "Developer not found",
      });
    }

    ticket.assignedDeveloper = developer._id;
    ticket.status = "Assigned";

    await ticket.save();

    const result = await populateTicket(
      Ticket.findById(ticket._id)
    );

    return res.status(200).json({
      success: true,
      message: "Developer assigned successfully",
      ticket: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN REVIEW — save assignment, status, and priority together.
export const reviewTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { developerId, status, priority } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ticket ID" });
    }

    if (!validStatuses.includes(status) || !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Valid ticket status and priority are required",
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    if (developerId) {
      if (!mongoose.isValidObjectId(developerId)) {
        return res.status(400).json({ success: false, message: "Invalid developer ID" });
      }

      const developer = await User.findOne({ _id: developerId, role: "developer" });
      if (!developer) {
        return res.status(400).json({ success: false, message: "Developer not found" });
      }

      ticket.assignedDeveloper = developer._id;
    } else {
      ticket.assignedDeveloper = null;
    }

    if (status === "Assigned" && !ticket.assignedDeveloper) {
      return res.status(400).json({
        success: false,
        message: "Assign a developer before setting the ticket to Assigned",
      });
    }

    ticket.status = status;
    ticket.priority = priority;
    await ticket.save();

    if (developerId) {
      const developer = await User.findById(developerId).select("name");
      await createActivity({
        actor: req.user._id,
        action: "Ticket assigned",
        description: `Ticket assigned to ${developer?.name || "a developer"}`,
        entityType: "Ticket",
        ticket: ticket._id,
        project: ticket.project,
      });
    } else if (ticket.assignedDeveloper == null) {
      await createActivity({
        actor: req.user._id,
        action: "Developer unassigned",
        description: "The developer assignment was removed",
        entityType: "Ticket",
        ticket: ticket._id,
        project: ticket.project,
      });
    }

    await createActivity({
      actor: req.user._id,
      action: "Ticket reviewed",
      description: `Ticket status: ${status}; priority: ${priority}`,
      entityType: "Ticket",
      ticket: ticket._id,
      project: ticket.project,
    });

    const result = await populateTicket(Ticket.findById(ticket._id));
    return res.status(200).json({
      success: true,
      message: "Ticket review saved successfully",
      ticket: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE STATUS — Assigned developer
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (
      ticket.assignedDeveloper?.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned developer can update this ticket",
      });
    }

    if (ticket.status === "Closed" || ticket.status === "Resolved") {
      return res.status(400).json({
        success: false,
        message: "This ticket is already resolved or closed",
      });
    }

    // Developer can move Assigned -> In Progress -> Resolved.
    // Reopening or closing requires a separate admin workflow.
    const allowedTransitions = {
      Assigned: ["In Progress"],
      "In Progress": ["Resolved"],
    };

    if (!allowedTransitions[ticket.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${ticket.status} to ${status}`,
      });
    }

    if (status === "Resolved" && !resolution?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resolution details are required",
      });
    }

    if (resolution !== undefined) {
      ticket.resolution = resolution;
    }

    ticket.status = status;
    ticket.resolvedAt = status === "Resolved" ? new Date() : null;

    await ticket.save();

    await createActivity({
      actor: req.user._id,
      action: status === "Resolved" ? "Ticket resolved" : "Ticket status updated",
      description:
        status === "Resolved"
          ? `Ticket resolved: ${resolution.trim()}`
          : `Ticket status changed to ${status}`,
      entityType: "Ticket",
      ticket: ticket._id,
      project: ticket.project,
    });

    const result = await populateTicket(
      Ticket.findById(ticket._id)
    );

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE TICKET — Admin
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await ticket.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
