
import express from "express";

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin: create project
router.post(
  "/",
  protect,
  authorizeRoles("admin", "client"),
  createProject
);

// Admin: all projects
// Client: own projects
// Developer: projects linked to assigned tickets
router.get(
  "/",
  protect,
  authorizeRoles("admin", "client", "developer"),
  getProjects
);

// View one project
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "client", "developer"),
  getProjectById
);

// Admin: update project
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateProject
);

// Admin: delete project
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteProject
);

export default router;
