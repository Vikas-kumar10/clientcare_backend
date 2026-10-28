import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["client", "developer", "admin"],
      default: "client",
      required: true,
    },
    phone: {
      type: String,
      default: "",
      maxlength: 20,
    },

    company: {
      type: String,
      default: "",
      maxlength: 100,
    },

    jobTitle: {
      type: String,
      default: "",
      maxlength: 100,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
