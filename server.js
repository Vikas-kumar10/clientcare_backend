// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import connectDB from "./config/db.js";
// import authRoutes from "./routes/authRoutes.js";
// import adminAuthRoutes from "./routes/adminAuthRoutes.js";
// import projectRoutes from "./routes/projectRoutes.js";
// import ticketRoutes from "./routes/ticketRoutes.js";
// import activityRoutes from "./routes/activityRoutes.js";
// import userRoutes from "./routes/userRoutes.js";

// dotenv.config();

// const app = express();

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//   })
// );

// app.use(express.json());

// // Authentication APIs
// app.use("/api/auth", authRoutes);
// app.use("/api/admin-auth", adminAuthRoutes);
// app.use("/api/projects", projectRoutes);
// app.use("/api/tickets", ticketRoutes);
// app.use("/api/activities", activityRoutes);
// app.use("/api/users", userRoutes);

// // Test API
// app.get("/api/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "ClientCare API is running",
//   });
// });

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   try {
//     await connectDB();

//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error("Server startup failed:", error.message);
//     process.exit(1);
//   }
// };

// startServer();

/*-------------------------- */

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173"
)
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as Postman.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

// Authentication APIs
app.use("/api/auth", authRoutes);
app.use("/api/admin-auth", adminAuthRoutes);

// Project APIs
app.use("/api/projects", projectRoutes);

// Ticket APIs
app.use("/api/tickets", ticketRoutes);

// Activity APIs
app.use("/api/activities", activityRoutes);

// User APIs
app.use("/api/users", userRoutes);

// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ClientCare API is running",
  });
});

// Global error handler for CORS and other errors
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  res.status(err.message === "Not allowed by CORS" ? 403 : 500).json({
    success: false,
    message:
      err.message === "Not allowed by CORS"
        ? "Origin not allowed"
        : "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`ClientCare API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
