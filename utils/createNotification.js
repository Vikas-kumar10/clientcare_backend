import Notification from "../models/Notification.js";

// A notification failure must not prevent the ticket action from succeeding.
export const createNotification = async ({
  recipient,
  recipients,
  type,
  title,
  message,
  ticket = null,
}) => {
  const recipientIds = [...new Set(
    (recipients || [recipient]).filter(Boolean).map((id) => id.toString())
  )];

  if (!recipientIds.length) return [];

  try {
    return await Notification.insertMany(
      recipientIds.map((recipientId) => ({
        recipient: recipientId,
        type,
        title,
        message,
        ticket,
      })),
      { ordered: false }
    );
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return [];
  }
};
