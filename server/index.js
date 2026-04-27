const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const Message = require("./models/Message");

app.use(cors());
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {} 
});


mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected Mama! 💥"))
  .catch((err) => console.log("DB Connection Error:", err));

  

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);

    try {
      // 1. Load previous messages from DB
      const messages = await Message.find({ room: room });
      socket.emit("previous_messages", messages);


    } catch (err) {
      console.log("Error in join_room:", err);
    }
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("display_typing", data.username);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.room).emit("hide_typing");
  });

  socket.on("delete_message", async (data) => {
    try {
      await Message.findByIdAndDelete(data.id);
      io.to(data.room).emit("message_deleted", data.id);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const newMessage = new Message(data);
      const savedMessage = await newMessage.save();
      io.to(data.room).emit("receive_message", savedMessage);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT} ! 🚀`);
});