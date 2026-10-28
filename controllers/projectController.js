
import mongoose from "mongoose";
import Project from "../models/Project.js";
import User from "../models/User.js";


 // CREATE PROJECT (Admin or Client)
export const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      client,
      status,
      startDate,
      deadline,
    } = req.body;

    // Validate project name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    // Client creates a project for themselves.
    // Admin must select a client.
    const clientId =
      req.user.role === "client" ? req.user._id : client;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Please select a client",
      });
    }

    if (!mongoose.isValidObjectId(clientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    // Verify the selected client exists and has the client role
    const clientUser = await User.findById(clientId);

    if (!clientUser || clientUser.role !== "client") {
      return res.status(400).json({
        success: false,
        message: "Please select a valid client",
      });
    }

    // Validate status
    const validStatuses = [
      "Planning",
      "Active",
      "On Hold",
      "Completed",
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project status",
      });
    }

    // Validate dates
    if (
      deadline &&
      startDate &&
      new Date(deadline) < new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before the start date",
      });
    }

    // Create project
    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || "",
      client: clientId,
      ...(status && { status }),
      ...(startDate && { startDate }),
      ...(deadline && { deadline }),
      createdBy: req.user._id,
    });

    // Populate client and creator details
    const populatedProject = await Project.findById(project._id)
      .populate("client", "name email")
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};


// GET PROJECTS
export const getProjects = async (req, res) => {
  try {
    let filter = {};

    // Clients can see only their own projects
    if (req.user.role === "client") {
      filter.client = req.user._id;
    }

    // Admin can see all projects
    // Developers can see only projects linked to their assigned tickets
    if (req.user.role === "developer") {
      const Ticket = (await import("../models/Ticket.js")).default;

      const assignedTickets = await Ticket.find({
        assignedDeveloper: req.user._id,
      }).distinct("project");

      filter._id = { $in: assignedTickets };
    }

    const projects = await Project.find(filter)
      .populate("client", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE PROJECT
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(id)
      .populate("client", "name email")
      .populate("createdBy", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Client can access only their own project
    if (
      req.user.role === "client" &&
      project.client._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this project",
      });
    }

    // Developer must have an assigned ticket for this project
    if (req.user.role === "developer") {
      const Ticket = (await import("../models/Ticket.js")).default;

      const hasAssignedTicket = await Ticket.exists({
        project: project._id,
        assignedDeveloper: req.user._id,
      });

      if (!hasAssignedTicket) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this project",
        });
      }
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE PROJECT (Admin only)
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, client, status, startDate, deadline } =
      req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (client !== undefined) {
      if (!mongoose.isValidObjectId(client)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client ID",
        });
      }

      const clientUser = await User.findById(client);

      if (!clientUser || clientUser.role !== "client") {
        return res.status(400).json({
          success: false,
          message: "Please select a valid client",
        });
      }

      project.client = client;
    }

    if (status !== undefined) {
      if (
        !["Planning", "Active", "On Hold", "Completed"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid project status",
        });
      }

      project.status = status;
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate || null;
    if (deadline !== undefined) project.deadline = deadline || null;

    const effectiveStartDate = project.startDate;
    const effectiveDeadline = project.deadline;

    if (
      effectiveStartDate &&
      effectiveDeadline &&
      effectiveDeadline < effectiveStartDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before the start date",
      });
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("client", "name email")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE PROJECT (Admin only)
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
