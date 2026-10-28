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
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

// Root route: displays in browser
app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ClientCare API</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: Arial, sans-serif;
            background: #FAF7F2;
            color: #292524;
          }
          .card {
            text-align: center;
            padding: 40px;
            margin: 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 30px #29252412;
          }
          h1 { color: #C2410C; }
          p { line-height: 1.7; }
          a { color: #C2410C; }
        </style>
      </head>
      <body>
        <main class="card">
          <h1>ClientCare API</h1>
          <p>Server is running successfully!</p>
          <p>Backend services are ready.</p>
          <a href="/api/health">Check API Health</a>
        </main>
      </body>
    </html>
  `);
});

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

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ClientCare API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
