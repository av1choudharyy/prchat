import { format } from "date-fns";
export const exportChatAsMarkdown = (messages) => {
  const markdown = messages
    .map((msg) => {
      const time = format(new Date(msg.createdAt), "PPpp");
      return `### ${msg.sender.name} — ${time}\n\n${msg.content}\n`;
    })
    .join("\n---\n\n");

  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "chat-history.md";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};