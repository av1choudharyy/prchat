// client/src/components/MessageContent.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useColorMode } from "@chakra-ui/react";

/**
 * MessageContent
 * - Renders markdown content with code syntax highlighting.
 * - Props:
 *   - content: string (markdown)
 */
const MessageContent = ({ content = "" }) => {
  const { colorMode } = useColorMode();
  const prismStyle = colorMode === "light" ? oneLight : oneDark;

  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter style={prismStyle} language={match[1]} PreTag="div" {...props}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code style={{ padding: "0 6px", borderRadius: 4, background: colorMode === "light" ? "#f3f4f6" : "#0b1220" }} {...props}>
          {children}
        </code>
      );
    },
    a({ href, children, ...props }) {
      return <a href={href} target="_blank" rel="noreferrer noopener" {...props}>{children}</a>;
    }
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content || ""}
    </ReactMarkdown>
  );
};

export default MessageContent;
