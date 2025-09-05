import { Avatar, Tooltip } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import Lottie from "lottie-react";
import ChatBubble from './ChatBubble';
import "../App.css";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";

const ScrollableChat = ({ messages, isTyping, setReplyToMessage }) => {
  const { user } = ChatState();

  const scrollRef = useRef();

  useEffect(() => {
    // Scroll to the bottom when messeges render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        
        {messages &&
          messages.map((message, index) => (
            <div ref={scrollRef} 
                  key={message._id} 
                  style={{ 
                      display: "flex",  
                      alignItems: "flex-end",
                       padding: "5px 15px",
                       maxWidth: "75%",
                      justifyContent: message.sender._id === user._id ? "flex-end" : "flex-start", 
                       marginLeft: isSameSenderMargin(messages,message,index,user._id),
                      marginTop: isSameUser(messages, message, index) ? 3 : 10,
                    }}>
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

               <ChatBubble 
                message={message} 
                isSelf={message.sender._id === user._id}
                setReplyToMessage={setReplyToMessage}
              />

            </div>
          ))}
      </div>
      {isTyping ? (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default ScrollableChat;
