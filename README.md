# PRChat - Real-time Chat Application

A real-time chat application built with React, Node.js, Socket.io, and MongoDB.

## Features

- Real-time messaging
- Group chats
- Direct messages  
- User authentication
- Typing indicators
- Message notifications
Additional features added
- Copy message
- Reply to message
- Search messages (frontend)
- Suggestions while typing
- Emoji reaction on chat

## Tech Stack

**Frontend:** React, Chakra UI, Socket.io-client  
**Backend:** Node.js, Express, Socket.io  
**Database:** MongoDB  
**Authentication:** JWT

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
