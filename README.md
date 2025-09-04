# PRChat - Real-time Chat Application

A real-time chat application built with React, Node.js, Socket.io, and MongoDB.

## Features

- Real-time messaging
- Group chats
- Direct messages  
- User authentication
- Typing indicators
- Message notifications
- File and image attachments with drag-and-drop support

## Tech Stack

**Frontend:** React, Chakra UI, Socket.io-client  
**Backend:** Node.js, Express, Socket.io  
**Database:** MongoDB  
**Authentication:** JWT

## File Attachment Features

### Supported File Types
- **Images**: JPEG, JPG, PNG, GIF, WebP
- **Videos**: MP4, AVI, MOV, WMV, WebM
- **Audio**: MP3, WAV, OGG, M4A
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV
- **Archives**: ZIP, RAR, 7Z

### File Upload Specifications
- **Maximum file size**: 50MB
- **Drag and drop support**: Drop files directly into the chat input area
- **Auto-send**: Files are automatically sent when selected (if no text message)
- **Preview support**: Images display with preview and full-screen modal view
- **Download support**: All files can be downloaded with original filenames

### How to Use File Attachments
1. Click the attachment icon (📎) in the chat input area
2. Select a file from your device, or drag and drop files directly
3. Files will be uploaded and sent automatically
4. Images appear as previews in the chat
5. Other files appear as downloadable cards with file info
6. Click on images to view them in full-screen mode
7. Click the download icon on file cards to download

## Getting Started

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Local Setup

1. **Install dependencies**
```bash
npm install
cd client && npm install && cd ..
```

2. **Environment Setup**
```bash
# Create .env file with:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=2d
NODE_ENV=development
```

3. **Run the application**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

## Test Users

Pre-configured test accounts:
- test1@example.com / password123
- test2@example.com / password123
- test3@example.com / password123
- guest@example.com / 123456

## Project Structure

```
prchat/
├── client/          # React frontend
├── controllers/     # Express controllers
├── middleware/      # Auth middleware
├── models/          # Database models
├── routes/          # API routes
├── server.js        # Express server
└── docker-compose.yml
```

## License

MIT