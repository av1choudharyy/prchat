export default function MessageList({ messages }) {
  return (
    <div>
      {messages.map((m, i) => (
        <div key={i}>
          <b>{m.sender}</b>: {m.fileUrl ? <a href={`http://localhost:5000${m.fileUrl}`} target="_blank" rel="noreferrer">{m.text}</a> : m.text}
        </div>
      ))}
    </div>
  );
}
