import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    chatType: {
      type: String,
      enum: ["client_admin", "admin_developer"],
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderName: { type: String, required: true, trim: true, maxlength: 100 },
    senderRole: {
      type: String,
      enum: ["client", "admin", "developer"],
      required: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true }
);

messageSchema.index({ ticket: 1, chatType: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
