# PRChat - Real-time Chat Application

A feature-complete real-time chat application built with React, Node.js, Socket.io, and MongoDB.

## ✨ Features

- ⚡ **Real-time messaging** - Instant message delivery using Socket.io
- 👥 **Group chats** - Create and manage multi-user chat rooms
- 💬 **Direct messages** - Private one-on-one conversations
- 🔐 **User authentication** - Secure login and registration with JWT
- ⌨️ **Typing indicators** - See when other users are typing
- 🔔 **Message notifications** - Real-time notification system
- 📱 **Responsive design** - Works on desktop and mobile
- 🎨 **Modern UI** - Clean interface with Chakra UI

## 🛠 Tech Stack

**Frontend:** React, Chakra UI, Socket.io-client  
**Backend:** Node.js, Express, Socket.io  
**Database:** MongoDB  
**Authentication:** JWT

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone and navigate to the project**
```bash
git clone <repository-url>
cd prchat
```

2. **Start the application**
```bash
# Windows
start.bat

# Linux/Mac
./start.sh

# Or manually:
docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Option 2: Local Development Setup

1. **Prerequisites**
   - Node.js (v14 or higher)
   - MongoDB (running locally or Atlas connection)

2. **Install dependencies**
```bash
npm install
cd client && npm install && cd ..
```

3. **Environment Setup**
```bash
# Copy .env.example to .env and update values
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/prchat
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=2d
NODE_ENV=development
```

4. **Start the application**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

## 👥 Test Users

Pre-configured test accounts for immediate testing:

| Email | Password | Description |
|-------|----------|-------------|
| test1@example.com | password123 | Test User 1 |
| test2@example.com | password123 | Test User 2 |
| test3@example.com | password123 | Test User 3 |
| guest@example.com | 123456 | Guest User |

## 📁 Project Structure

```
prchat/
├── 📂 client/              # React frontend application
│   ├── 📂 src/
│   │   ├── 📂 components/   # Reusable React components
│   │   ├── 📂 pages/        # Main page components
│   │   ├── 📂 context/      # React Context providers
│   │   └── 📂 config/       # Frontend configuration
│   └── 📄 package.json
├── 📂 controllers/         # Express route controllers
├── 📂 middleware/          # Authentication & error middleware
├── 📂 models/              # Mongoose database models
├── 📂 routes/              # API route definitions
├── 📂 config/              # Backend configuration
├── 📄 server.js            # Express server entry point
├── 📄 docker-compose.yml   # Docker container configuration
└── 📄 package.json         # Backend dependencies
```

## 🔧 API Endpoints

### Authentication
- `POST /api/user` - Register new user
- `POST /api/user/login` - User login
- `GET /api/user?search=` - Search users

### Chats
- `POST /api/chat` - Create/access one-on-one chat
- `GET /api/chat` - Fetch all chats for user
- `POST /api/chat/group` - Create group chat
- `PUT /api/chat/rename` - Rename group
- `PUT /api/chat/groupadd` - Add user to group
- `PUT /api/chat/groupremove` - Remove user from group

### Messages
- `POST /api/message` - Send message
- `GET /api/message/:chatId` - Get chat messages

## 🎯 Socket.io Events

### Client → Server
- `setup` - Initialize user connection
- `join chat` - Join specific chat room
- `typing` - User started typing
- `stop typing` - User stopped typing
- `new message` - Send new message
- `leave chat` - Leave chat room

### Server → Client
- `connected` - Connection established
- `typing` - Another user is typing
- `stop typing` - Another user stopped typing
- `message received` - New message received

## 🚨 Troubleshooting

### Common Issues

1. **Docker not starting**
   - Make sure Docker Desktop is running
   - Check if ports 3000 and 5000 are available

2. **MongoDB connection issues**
   - Verify MongoDB is running (local setup)
   - Check MONGO_URI in .env file

3. **Socket.io connection problems**
   - Check if backend is running on port 5000
   - Verify CORS settings in server.js

4. **Authentication errors**
   - Ensure JWT_SECRET is set in .env
   - Check token expiration settings

## 📝 License

MIT License - see LICENSE file for details