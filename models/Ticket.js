
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Ticket title is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Ticket description is required"],
      trim: true,
      minlength: 5,
      maxlength: 5000,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
      index: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client is required"],
      index: true,
    },

    assignedDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Open", "Assigned", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },

    resolution: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
