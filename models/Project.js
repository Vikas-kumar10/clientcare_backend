
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // Reference to the client in the User collection
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client is required"],
    },

    status: {
      type: String,
      enum: ["Planning", "Active", "On Hold", "Completed"],
      default: "Planning",
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    deadline: {
      type: Date,
      default: null,
    },

    // User who created the project
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project creator is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
