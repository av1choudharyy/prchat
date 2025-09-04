const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const Chat = require("./models/Chat"); // or wherever your Mongoose model lives

const { connectToMongoDB } = require("./config/index.js");
const { userRoutes, chatRoutes, messageRoutes } = require("./routes");
const { notFound, errorHandler } = require("./middleware");

const app = express(); // Use express js in our app
app.use(express.json()); // Accept JSON data
dotenv.config({ path: path.join(__dirname, "./.env") }); // Specify a custom path if your file containing environment variables is located elsewhere
connectToMongoDB(); // Connect to Database

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------DEPLOYMENT------------------------------

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

// --------------------------DEPLOYMENT------------------------------

app.use(notFound); // Handle invalid routes
app.use(errorHandler);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on PORT ${process.env.PORT}`)
);

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
  },
  pingTimeout: 60 * 1000,
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

 socket.on("new message", async (newMessage) => {
  try {
    const chat = await Chat.findById(newMessage.chat)
      .populate("users", "name email");

    if (!chat || !chat.users) {
      console.log("chat.users not defined");
      return;
    }

    chat.users.forEach((user) => {
      if (user._id.toString() !== newMessage.sender._id.toString()) {
        socket.to(user._id.toString()).emit("message recieved", newMessage);
      }
    });
  } catch (error) {
    console.error("Socket error in 'new message':", error);
  }
});

  socket.off("setup", () => {
    console.log("User Disconnected");
    socket.leave(userData._id);
  });
});
