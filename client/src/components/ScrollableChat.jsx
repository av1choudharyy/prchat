import { Avatar, Tooltip } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";
import Lottie from "lottie-react";
import "../App.css";

// ✅ helper: format text with bold/italic/colors
const formatMessage = (text) => {
  if (!text) return "";

  // Bold: **word**
  text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

  // Italic: *word*
  text = text.replace(/\*(.*?)\*/g, "<i>$1</i>");

  // Colors: ~red:word~, ~blue:word~, ~green:word~
  text = text.replace(/~red:(.*?)~/g, "<span style='color:red'>$1</span>");
  text = text.replace(/~blue:(.*?)~/g, "<span style='color:blue'>$1</span>");
  text = text.replace(/~green:(.*?)~/g, "<span style='color:green'>$1</span>");

  return text;
};

// ✅ helper: highlight search term inside styled text
const highlightText = (html, query) => {
  if (!query) return html;

  // Wrap search query matches with yellow background
  const regex = new RegExp(`(${query})`, "gi");
  return html.replace(
    regex,
    `<span style="background-color: yellow">$1</span>`
  );
};

const ScrollableChat = ({ messages, isTyping, searchQuery }) => {
  const { user } = ChatState();
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto", height: "100%" }}
      >
        {messages &&
          messages.map((message, index) => {
            // 1. apply font styling
            let formatted = formatMessage(message.content);
            // 2. apply highlighting on top of formatting
            let finalText = highlightText(formatted, searchQuery);

            return (
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
                  dangerouslySetInnerHTML={{ __html: finalText }}
                />
              </div>
            );
          })}
      </div>
      {isTyping ? (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : null}
    </>
  );
};

export default ScrollableChat;
