# Markdown Chat Features

This document describes the new markdown messaging features added to the PRChat application.

## Overview

The chat application now supports rich markdown formatting with live preview capabilities, allowing users to create more expressive and well-formatted messages.

## Features

### Core Features

#### 1. Markdown Input Component
- **Write/Preview Modes**: Toggle between writing markdown and previewing the rendered output
- **Auto-expanding Textarea**: Grows with content up to a maximum height of 300px
- **Live Preview**: Real-time rendering of markdown syntax
- **File Upload Support**: Attach files while composing markdown messages

#### 2. Supported Markdown Syntax
- **Text Formatting**:
  - `**bold text**` or `__bold text__` for bold
  - `*italic text*` or `_italic text_` for italic
  - `` `inline code` `` for inline code
  - `~~strikethrough~~` for strikethrough text

- **Headings**:
  - `# Heading 1`
  - `## Heading 2`
  - `### Heading 3`

- **Lists**:
  - `- Item 1` for bullet lists
  - `1. First item` for numbered lists
  - `- [x] Done` for task lists

- **Links & Images**:
  - `[Link text](https://example.com)` for links
  - `![Alt text](image.jpg)` for images

- **Code Blocks**:
  - ``` `code block` ``` for code blocks
  - ```javascript `language-specific code` ``` for syntax highlighting

- **Other**:
  - `> Quote text` for blockquotes
  - `---` for horizontal rules
  - Tables with `| Col1 | Col2 |` syntax

#### 3. Enhanced User Experience
- **Markdown Toolbar**: Quick access buttons for common formatting
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + Enter` to send message
  - `Escape` to toggle between write/preview modes
- **Typing Indicator**: Shows "Typing..." when composing
- **Help Panel**: Collapsible reference guide for markdown syntax
- **File Attachment**: Visual file attachment with remove option

#### 4. Message Display
- **Smart Rendering**: Automatically detects markdown syntax in messages
- **Fallback Support**: Regular text messages display normally
- **Responsive Design**: Markdown elements adapt to chat bubble styling
- **Link Handling**: External links open in new tabs

### Integration

#### Toggle Switch
- Located above the input area
- Switch between regular text input and markdown mode
- Maintains existing functionality when disabled

#### Backward Compatibility
- All existing chat features remain unchanged
- Regular text messages work exactly as before
- File uploads work in both modes
- Emoji picker available in regular mode

## Usage

### Enabling Markdown Mode
1. Look for the "Markdown Mode" toggle switch above the input area
2. Toggle it on to enable markdown features
3. The input area will switch to the markdown editor

### Writing Markdown Messages
1. Type your message using markdown syntax
2. Use the toolbar buttons for quick formatting
3. Toggle to "Preview" mode to see rendered output
4. Click "Send" or use `Ctrl/Cmd + Enter` to send

### Using the Help Panel
1. Click "Markdown Help" button in the toolbar
2. Reference the syntax examples
3. Click outside or the close button to dismiss

### File Attachments
1. Click the paperclip icon in the toolbar
2. Select a file to attach
3. The file will be displayed below the input
4. Click "Remove" to detach the file

## Technical Implementation

### Components
- `MarkdownInput.jsx`: Main markdown input component
- `MarkdownHelp.jsx`: Syntax help panel
- `ScrollableChat.jsx`: Updated to render markdown in messages
- `SingleChat.jsx`: Integration point with toggle functionality

### Dependencies
- `react-markdown`: Markdown rendering
- `remark-gfm`: GitHub Flavored Markdown support
- `@chakra-ui/react`: UI components
- `react-icons/md`: Material Design icons

### Key Features
- **Conditional Rendering**: Smart detection of markdown syntax
- **Theme Support**: Works with both light and dark modes
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Future Enhancements

Potential future improvements could include:
- Syntax highlighting in write mode
- Image preview in messages
- Export chat history as markdown
- Custom markdown themes
- Collaborative editing features
- Markdown templates

## Browser Support

The markdown features work in all modern browsers that support:
- ES6+ JavaScript features
- CSS Grid and Flexbox
- File API for uploads
- Clipboard API for copy/paste

## Performance

- Markdown rendering is optimized for chat messages
- Lazy loading of help panel content
- Efficient re-rendering with React hooks
- Minimal impact on existing chat performance

