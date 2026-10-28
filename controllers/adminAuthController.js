import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
} from "../config/adminCredentials.js";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (
      email.toLowerCase().trim() !== ADMIN_EMAIL ||
      password !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password",
      });
    }

    let user = await User.findOne({ email: ADMIN_EMAIL });

    if (user && user.role !== "admin") {
      return res.status(409).json({
        success: false,
        message: "The configured admin email belongs to a non-admin account",
      });
    }

    if (!user) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      user = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during admin login",
    });
  }
};
