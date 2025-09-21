import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import "./MarkdownMessageInput.css";

const MarkdownMessageInput = ({ value, onChange, inputRef, id, placeholder, style }) => {
  const [mode, setMode] = useState("write");
  const localRef = useRef();
  const textareaRef = inputRef || localRef;

  const insertAtCursor = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + type === 'bold' ? '**bold text**' : type === 'italic' ? '*italic text*' : type === 'code' ? '`code`' : type === 'link' ? '[text](url)' : '\n- List item');
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    let insert, cursorPos;
    switch (type) {
      case 'bold':
        insert = `**${selected || 'bold text'}**`;
        cursorPos = start + 2;
        break;
      case 'italic':
        insert = `*${selected || 'italic text'}*`;
        cursorPos = start + 1;
        break;
      case 'code':
        insert = `\u007F${selected || 'code'}\u007F`.replace(/\u007F/g, '`');
        cursorPos = start + 1;
        break;
      case 'link':
        insert = `[${selected || 'text'}](url)`;
        cursorPos = start + 1;
        break;
      case 'list':
        insert = `\n- ${selected || 'List item'}`;
        cursorPos = start + 4;
        break;
      default:
        insert = '';
        cursorPos = start;
    }
    onChange(insert);
    setTimeout(() => {
      textarea.focus();
      if (!selected) {
        textarea.selectionStart = textarea.selectionEnd = cursorPos;
      } else {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + insert.length;
      }
    }, 0);
  };

  const highlightMarkdown = (code) => Prism.highlight(code, Prism.languages.markdown, "markdown");

  const editorRef = textareaRef;

  return (
    <div className="markdown-input-container" style={{ width: '100%' }}>
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "6px",
          marginTop: "4px",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          title="Bold"
          style={{ fontWeight: "bold", fontSize: "16px", border: "none", background: "#e0e0e0", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", color: '#000' }}
          onClick={() => insertAtCursor('bold')}
        >B</button>
        <button
          type="button"
          title="Italic"
          style={{ fontStyle: "italic", fontSize: "16px", border: "none", background: "#e0e0e0", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", color: '#000' }}
          onClick={() => insertAtCursor('italic')}
        >I</button>
        <button
          type="button"
          title="Code"
          style={{ fontFamily: "monospace", fontSize: "16px", border: "none", background: "#e0e0e0", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", color: '#000' }}
          onClick={() => insertAtCursor('code')}
        >{'</>'}</button>
        <button
          type="button"
          title="Link"
          style={{ fontSize: "16px", border: "none", background: "#e0e0e0", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", color: '#000' }}
          onClick={() => insertAtCursor('link')}
        >🔗</button>
        <button
          type="button"
          title="List"
          style={{ fontSize: "16px", border: "none", background: "#e0e0e0", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", color: '#000' }}
          onClick={() => insertAtCursor('list')}
        >• List</button>
      </div>
      <div className="markdown-toggle">
        <button
          className={mode === "write" ? "active" : ""}
          onClick={() => setMode("write")}
          type="button"
        >
          Write
        </button>
        <button
          className={mode === "preview" ? "active" : ""}
          onClick={() => setMode("preview")}
          type="button"
        >
          Preview
        </button>
      </div>
      {mode === "write" ? (
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlightMarkdown}
          padding={12}
          textareaClassName="markdown-textarea"
          ref={editorRef}
          id={id}
          placeholder={placeholder || "Write your message in Markdown..."}
          style={{
            fontFamily: 'inherit',
            fontSize: '1rem',
            minHeight: 60,
            maxHeight: 300,
            color: '#000',
            width: '100%',
            background: '#f7fafc',
            borderRadius: 8,
            marginBottom: 4,
            border: '1px solid #cbd5e1',
            outline: 'none',
            ...style,
          }}
        />
      ) : (
        <div className="markdown-preview" style={{ minHeight: 60, width: '100%' }}>
          {value && value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <span style={{ color: '#888', fontStyle: 'italic' }}>
              Nothing to preview yet.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownMessageInput;