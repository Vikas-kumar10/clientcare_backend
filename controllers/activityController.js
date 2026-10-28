
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Ticket from "../models/Ticket.js";
import Project from "../models/Project.js";

// Reusable helper: call this from ticket/project controllers.
export const createActivity = async ({
  actor,
  action,
  description,
  entityType,
  ticket = null,
  project = null,
  metadata = {},
}) => {
  try {
    return await Activity.create({
      actor,
      action,
      description,
      entityType,
      ticket,
      project,
      metadata,
    });
  } catch (error) {
    // An activity logging failure should not break the main action.
    console.error("Activity creation failed:", error.message);
    return null;
  }
};

// GET /api/activities
export const getActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    let activityFilter = {};

    if (role === "admin") {
      // Admin can view all activities.
      activityFilter = {};
    } else if (role === "developer") {
      // Developers can view activities for tickets assigned to them.
      const assignedTickets = await Ticket.find({
        assignedDeveloper: userId,
      }).distinct("_id");

      activityFilter = {
        $or: [
          { actor: userId },
          { ticket: { $in: assignedTickets } },
        ],
      };
    } else if (role === "client") {
      // Clients can view activities for their own tickets and projects.
      const [ownTickets, ownProjects] = await Promise.all([
        Ticket.find({ createdBy: userId }).distinct("_id"),
        Project.find({ client: userId }).distinct("_id"),
      ]);

      activityFilter = {
        $or: [
          { actor: userId },
          { ticket: { $in: ownTickets } },
          { project: { $in: ownProjects } },
        ],
      };
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view activity logs.",
      });
    }

    // Optional filters
    if (req.query.ticketId) {
      if (!mongoose.isValidObjectId(req.query.ticketId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      activityFilter = {
        $and: [
          activityFilter,
          { ticket: req.query.ticketId },
        ],
      };
    }

    if (req.query.projectId) {
      if (!mongoose.isValidObjectId(req.query.projectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      activityFilter = {
        $and: [
          activityFilter,
          { project: req.query.projectId },
        ],
      };
    }

    const [activities, total] = await Promise.all([
      Activity.find(activityFilter)
        .populate("actor", "name email role")
        .populate("ticket", "title status priority")
        .populate("project", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Activity.countDocuments(activityFilter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Activity logs fetched successfully.",
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch activity logs.",
    });
  }
};

// POST /api/activities/tickets/:ticketId — assigned developer adds a note.
export const createTicketActivity = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const description = req.body.description?.trim();

    if (!mongoose.isValidObjectId(ticketId)) {
      return res.status(400).json({ success: false, message: "Invalid ticket ID." });
    }

    if (!description || description.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Activity note must be between 1 and 500 characters.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      assignedDeveloper: req.user._id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Assigned ticket not found.",
      });
    }

    const activity = await Activity.create({
      actor: req.user._id,
      action: "Developer note",
      description,
      entityType: "Comment",
      ticket: ticket._id,
    });

    const populatedActivity = await Activity.findById(activity._id)
      .populate("actor", "name email role")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Activity note added successfully.",
      activity: populatedActivity,
    });
  } catch (error) {
    console.error("Create ticket activity error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to add activity note.",
    });
  }
};
