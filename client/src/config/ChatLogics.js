export const getSender = (loggedUser, users, check) => {
  return users[0]?._id === loggedUser?._id ? users[1]?.name : users[0]?.name;
};

export const getSenderFull = (loggedUser, users) => {
  return users[0]?._id === loggedUser?._id ? users[1] : users[0];
};

export const isSameSender = (
  messages,
  currentMessage,
  currentMessageIndex,
  loggedUserId
) => {
  if (!currentMessage?.sender?._id) return false; // guard

  const nextMessage = messages[currentMessageIndex + 1];

  return (
    currentMessageIndex < messages.length - 1 &&
    nextMessage?.sender?._id !== currentMessage.sender._id &&
    currentMessage?.sender?._id !== loggedUserId
  );
};


export const isLastMessage = (messages, currentMessageIndex, loggedUserId) => {
  return (
    currentMessageIndex === messages.length - 1 &&
    messages[messages.length - 1]?.sender?._id !== loggedUserId &&
    messages[messages.length - 1]?.sender?._id
  );
};

export const isSameSenderMargin = (
  messages,
  currentMessage,
  currentMessageIndex,
  loggedUserId
) => {
  if (
    currentMessageIndex < messages.length - 1 &&
    messages[currentMessageIndex + 1]?.sender?._id ===
    currentMessage?.sender?._id &&
    messages[currentMessageIndex]?.sender?._id !== loggedUserId
  )
    return 33;
  else if (
    (currentMessageIndex < messages.length - 1 &&
      messages[currentMessageIndex + 1]?.sender?._id !==
      currentMessage?.sender?._id &&
      messages[currentMessageIndex]?.sender?._id !== loggedUserId) ||
    (currentMessageIndex === messages.length - 1 &&
      messages[currentMessageIndex]?.sender?._id !== loggedUserId)
  )
    return 0;
  else return "auto";
};

export const isSameUser = (messages, currentMessage, currentMessageIndex) => {
  return (
    currentMessageIndex > 0 &&
    messages[currentMessageIndex - 1]?.sender?._id === currentMessage?.sender?._id
  );
};

export const formatTimestamp = (timestamp) => {
    const d = new Date(timestamp);
    const now = new Date();

    const oneDay = 24 * 60 * 60 * 1000;
    const diffInDays = Math.floor(
      (now.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / oneDay
    );

    if (diffInDays === 0) {
      // ✅ Today → show time
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInDays === 1) {
      // ✅ Yesterday
      return "Yesterday";
    } else if (diffInDays < 7) {
      // ✅ Last 7 days
      return new Date(timestamp).toLocaleDateString([], { weekday: "long" });
    } else {
      // ✅ Older → show date (no year)
      return new Date(timestamp).toLocaleDateString([], { month: "short", day: "2-digit" });
    }
}
