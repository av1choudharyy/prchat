// src/config/ChatLogics.js
// Defensive, well-documented helper functions for chat UI logic.

export const getSender = (loggedUser, users) => {
  // returns the display name of the *other* user in a one-to-one chat
  if (!loggedUser || !users || !Array.isArray(users) || users.length === 0) return "";
  // find user whose id !== loggedUser._id
  const other = users.find((u) => u && u._id !== loggedUser._id);
  return other?.name ?? users[0]?.name ?? "";
};

export const getSenderFull = (loggedUser, users) => {
  // returns the full user object of the other participant for one-to-one chat
  if (!loggedUser || !users || !Array.isArray(users) || users.length === 0) return null;
  return users.find((u) => u && u._id !== loggedUser._id) ?? users[0] ?? null;
};

// used by ScrollableChat to decide whether to show avatar (sender change)
export const isSameSender = (messages, m, i, userId) => {
  if (!messages || !Array.isArray(messages) || !m) return false;
  // if next message exists and its sender is different from current message sender
  const next = messages[i + 1];
  return (
    i < messages.length - 1 &&
    (next?.sender?._id !== m.sender?._id) &&
    m.sender?._id !== userId
  );
};

export const isLastMessage = (messages, i, userId) => {
  if (!messages || !Array.isArray(messages)) return false;
  const lastIndex = messages.length - 1;
  return lastIndex === i && messages[lastIndex]?.sender?._id !== userId;
};

export const isSameUser = (messages, m, i, userId) => {
  if (!messages || !Array.isArray(messages) || !m) return false;
  const prev = messages[i - 1];
  return i > 0 && prev?.sender?._id === m.sender?._id;
};

/**
 * isSameSenderMargin - returns a margin-left value (string with px) used by message bubble layout
 * - original projects sometimes return a number (e.g. 33). Here we return a CSS value string.
 */
export const isSameSenderMargin = (messages, m, i, userId) => {
  if (!messages || !Array.isArray(messages) || !m) return "0px";

  // if message is from current user, align to right (auto margin)
  if (m.sender?._id === userId) return "auto";

  // if next message has same sender => indent to align with avatar
  const next = messages[i + 1];
  if (i < messages.length - 1 && next?.sender?._id === m.sender?._id) return "48px";

  // if previous message is same sender (grouped), keep same indent
  const prev = messages[i - 1];
  if (i > 0 && prev?.sender?._id === m.sender?._id) return "48px";

  // otherwise no extra left margin
  return "0px";
};
