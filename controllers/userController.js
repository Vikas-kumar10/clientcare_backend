import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const role = String(req.query.role || "").toLowerCase();
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select("name email role company createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
};
