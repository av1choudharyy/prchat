import {
  Avatar,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";

import "../App.css";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";

const ScrollableChat = ({ messages, isTyping, searchTerm }) => {
  const { user } = ChatState();
  const scrollRef = useRef();

  // For preview modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [previewType, setPreviewType] = useState(""); // "image" | "pdf"
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // ✅ Highlight search term
  const highlightText = (text, keyword) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: "yellow" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // ✅ Handle preview open
  const handlePreview = (fileType, fileUrl, fileName) => {
    setPreviewType(fileType.startsWith("image/") ? "image" : "pdf");
    setPreviewUrl(fileUrl);
    setPreviewFileName(fileName || "file");
    onOpen();
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {Array.isArray(messages) &&
          messages.map((message, index) => (
            <div
              ref={scrollRef}
              key={message._id}
              style={{ display: "flex" }}
            >
              {(isSameSender(messages, message, index, user._id) ||
                isLastMessage(messages, index, user._id)) && (
                <Tooltip
                  label={message.sender.name}
                  placement="bottom-start"
                  hasArrow
                >
                  <Avatar
                    mt="7px"
                    mr="1"
                    size="sm"
                    cursor="pointer"
                    name={message.sender.name}
                    src={message.sender.pic}
                  />
                </Tooltip>
              )}

              <span
                style={{
                  backgroundColor: `${
                    message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                  }`,
                  borderRadius: "20px",
                  padding: "5px 15px",
                  maxWidth: "75%",
                  marginLeft: isSameSenderMargin(
                    messages,
                    message,
                    index,
                    user._id
                  ),
                  marginTop: isSameUser(messages, message, index, user._id)
                    ? 3
                    : 10,
                }}
              >
                {/* 📎 File handling */}
                {message.fileUrl ? (
                  message.fileType &&
                  message.fileType.startsWith("image/") ? (
                    // 🖼️ Image
                    <img
                      src={message.fileUrl}
                      alt={message.fileName}
                      style={{
                        maxWidth: "200px",
                        borderRadius: "10px",
                        marginTop: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handlePreview(message.fileType, message.fileUrl, message.fileName)
                      }
                    />
                  ) : message.fileType === "application/pdf" ? (
                    // 📄 PDF
                    <div
                      style={{
                        color: "blue",
                        textDecoration: "underline",
                        cursor: "pointer",
                        marginTop: "5px",
                      }}
                      onClick={() =>
                        handlePreview(message.fileType, message.fileUrl, message.fileName)
                      }
                    >
                      📄 {message.fileName || "Open PDF"}
                    </div>
                  ) : (
                    // Other file types → download link
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "blue",
                        textDecoration: "underline",
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      📎 {message.fileName || "Download File"}
                    </a>
                  )
                ) : (
                  highlightText(message.content, searchTerm)
                )}
              </span>
            </div>
          ))}
      </div>

      {/* ⌨️ Typing Animation */}
      {isTyping ? (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : null}

      {/* 🔍 Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalBody p={2}>
            {previewType === "image" ? (
              <img
                src={previewUrl}
                alt="preview"
                style={{ width: "100%", borderRadius: "10px" }}
              />
            ) : (
              <iframe
                src={previewUrl}
                title="PDF Preview"
                style={{ width: "100%", height: "600px", border: "none" }}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              as="a"
              href={previewUrl}
              download={previewFileName}
              colorScheme="blue"
              mr={3}
            >
              Download
            </Button>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScrollableChat;
