const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

const { connectToMongoDB } = require("./config");
const { userRoutes, chatRoutes, messageRoutes } = require("./routes");
const { notFound, errorHandler } = require("./middleware");

const app = express();
app.use(express.json());
dotenv.config({ path: path.join(__dirname, "./.env") });
connectToMongoDB();

// API routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Deployment
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./client/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => res.send("API is running"));
}

app.use(notFound);
app.use(errorHandler);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on PORT ${process.env.PORT}`)
);

// ------------------- SOCKET.IO -------------------
const io = require("socket.io")(server, {
  cors: { origin: "http://localhost:3001" },
  pingTimeout: 60000,
});

// Map to store multiple sockets per user
const userSockets = new Map(); // userId -> Set(socketIds)

io.on("connection", (socket) => {
  console.log("Connected to socket.io, socket id:", socket.id);

  // Setup user
  socket.on("setup", (userData) => {
    socket.userId = userData._id;
    if (!userSockets.has(userData._id))
      userSockets.set(userData._id, new Set());
    userSockets.get(userData._id).add(socket.id);
    socket.emit("connected");
    console.log(`User ${userData._id} connected with socket ${socket.id}`);
  });

  // Join chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined chat ${room}`);
  });

  // Typing indicators
  socket.on("typing", (room, userData) => {
    socket.in(room).emit("typing", userData);
  });

  socket.on("stop typing", (room, userData) => {
    socket.in(room).emit("stop typing", userData);
  });

  // New message
  socket.on("new message", (newMessageRecieved) => {
    const chat = newMessageRecieved.chat; // chat is an object
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;

      userSockets.get(user._id)?.forEach((socketId) => {
        io.to(socketId).emit("message recieved", newMessageRecieved);
      });
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    if (socket.userId && userSockets.has(socket.userId)) {
      userSockets.get(socket.userId).delete(socket.id);
      if (userSockets.get(socket.userId).size === 0)
        userSockets.delete(socket.userId);
    }
  });
});
