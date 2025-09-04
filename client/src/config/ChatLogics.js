export const getSender = (loggedUser, users) => {
  if (!loggedUser || !users || users.length < 2) return "Unknown User";
  return users[0]?._id === loggedUser._id ? users[1]?.name || "Unknown User" : users[0]?.name || "Unknown User";
};

export const getSenderFull = (loggedUser, users) => {
  if (!loggedUser || !users || users.length < 2) return { name: "Unknown User" };
  return users[0]?._id === loggedUser._id ? users[1] || { name: "Unknown User" } : users[0] || { name: "Unknown User" };
};

export const isSameSender = (
  messages,
  currentMessage,
  currentMessageIndex,
  loggedUserId
) => {
  if (!messages || !currentMessage || !currentMessage.sender || !loggedUserId) return false;

  return (
    currentMessageIndex < messages.length - 1 &&
    messages[currentMessageIndex + 1] &&
    messages[currentMessageIndex + 1].sender &&
    (messages[currentMessageIndex + 1].sender._id !==
      currentMessage.sender._id ||
      messages[currentMessageIndex + 1].sender._id === undefined) &&
    messages[currentMessageIndex].sender._id !== loggedUserId
  );
};

export const isLastMessage = (messages, currentMessageIndex, loggedUserId) => {
  if (!messages || messages.length === 0 || !loggedUserId) return false;

  const lastMessage = messages[messages.length - 1];
  return (
    currentMessageIndex === messages.length - 1 &&
    lastMessage &&
    lastMessage.sender &&
    lastMessage.sender._id !== loggedUserId &&
    lastMessage.sender._id
  );
};

export const isSameSenderMargin = (
  messages,
  currentMessage,
  currentMessageIndex,
  loggedUserId
) => {
  if (!messages || !currentMessage || !currentMessage.sender || !loggedUserId) return 0;

  if (
    currentMessageIndex < messages.length - 1 &&
    messages[currentMessageIndex + 1] &&
    messages[currentMessageIndex + 1].sender &&
    messages[currentMessageIndex + 1].sender._id ===
    currentMessage.sender._id &&
    messages[currentMessageIndex].sender._id !== loggedUserId
  )
    return 33;
  else if (
    (currentMessageIndex < messages.length - 1 &&
      messages[currentMessageIndex + 1] &&
      messages[currentMessageIndex + 1].sender &&
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
  if (!messages || !currentMessage || !currentMessage.sender) return false;

  return (
    currentMessageIndex > 0 &&
    messages[currentMessageIndex - 1] &&
    messages[currentMessageIndex - 1].sender &&
    messages[currentMessageIndex - 1].sender._id === currentMessage.sender._id
  );
};
