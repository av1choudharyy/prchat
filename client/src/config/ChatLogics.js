export const getSender = (loggedUser, users) => {
  if (!users || users.length === 0) return "Unknown";
  return users.find((u) => u._id !== loggedUser._id)?.name || "Unknown";
};

export const getSenderFull = (loggedUser, users) => {
  if (!users || users.length === 0) return {};
  return users.find((u) => u._id !== loggedUser._id) || {};
};

export const isSameSender = (
  messages,
  currentMessage,
  currentMessageIndex,
  loggedUserId
) => {
  return (
    currentMessageIndex < messages.length - 1 &&
    (messages[currentMessageIndex + 1].sender._id !==
      currentMessage.sender._id ||
      messages[currentMessageIndex + 1].sender._id === undefined) &&
    messages[currentMessageIndex].sender._id !== loggedUserId
  );
};

export const isLastMessage = (messages, currentMessageIndex, loggedUserId) => {
  return (
    currentMessageIndex === messages.length - 1 &&
    messages[messages.length - 1].sender._id !== loggedUserId &&
    messages[messages.length - 1].sender._id
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
    messages[currentMessageIndex + 1].sender._id ===
      currentMessage.sender._id &&
    messages[currentMessageIndex].sender._id !== loggedUserId
  )
    return 33;
  else if (
    (currentMessageIndex < messages.length - 1 &&
      messages[currentMessageIndex + 1].sender._id !==
        currentMessage.sender._id &&
      messages[currentMessageIndex].sender._id !== loggedUserId) ||
    (currentMessageIndex === messages.length - 1 &&
      messages[currentMessageIndex].sender._id !== loggedUserId)
  )
    return 0;
  else return "auto";
};

export const isSameUser = (messages, currentMessage, currentMessageIndex) => {
  return (
    currentMessageIndex > 0 &&
    messages[currentMessageIndex - 1].sender._id === currentMessage.sender._id
  );
};
