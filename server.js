const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

const { connectToMongoDB } = require("./config");
const {
  userRoutes,
  chatRoutes,
  messageRoutes,
  uploadRoutes, // ✅ make sure uploadRoutes is exported from routes/index.js
} = require("./routes");
const { notFound, errorHandler } = require("./middleware");

const app = express();
app.use(express.json()); // Accept JSON data

dotenv.config({ path: path.join(__dirname, "./.env") });
connectToMongoDB(); // Connect to Database

// -------------------------- API Routes ------------------------------
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/upload", uploadRoutes); // ✅ file uploads route
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ serve uploaded files

// -------------------------- DEPLOYMENT ------------------------------
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./client/build")));

  app.get("*", (req, res) => {
    return res.sendFile(
      path.resolve(__dirname, "client", "build", "index.html")
    );
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running");
  });
}
// -------------------------- DEPLOYMENT ------------------------------

app.use(notFound); // Handle invalid routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server started on PORT ${PORT}`)
);

// -------------------------- SOCKET.IO ------------------------------
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000", // adjust if frontend is hosted elsewhere
  },
  pingTimeout: 60000,
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined room " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    const chat = newMessageRecieved.chat[0]; // because chat is stored as array in your schema

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", (userData) => {
    console.log("User Disconnected");
    socket.leave(userData._id);
  });
});
