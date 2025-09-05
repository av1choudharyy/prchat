import { useState } from "react";
import axios from "axios";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const handleSend = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sender", "test1@example.com");
      const res = await axios.post("http://localhost:5000/api/messages/upload", formData);
      onSend(res.data);
      setFile(null);
    } else if (text) {
      onSend({ text, sender: "test1@example.com" });
      setText("");
    }
  };

  return (
    <div className="flex gap-2">
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Type..." />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}