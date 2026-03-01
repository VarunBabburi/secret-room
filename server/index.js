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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected Mama! 💥"))
  .catch((err) => console.log("DB Connection Error:", err));

// 🔥 Funny Bot Dialogues
const funnyDialogues = [
  "Evadra ikkada silent ga unnadu? Nuv Mogonivi ayithe mesg chey ra!",
  "Arey, evaraina matladandra babu.. lekapothe naku BP lethadhi!",
  "Em mama, andaru silent ayipoyaru? Evariki nenu gurthu ledha?",
  "Orey, ekkadunnav ra? Nee kosam ikkada andaru waiting!",
  "Varun App ante aa mathram premium untadhi mari.. enjoy pandago!",
  "Chatting cheyyandi ra ante, group lo andaru nidrapothunnara?",
  "Enti mama.. message kottadaniki kuda intha tension ah?"
];

// Room-wise bot control cheyadaniki oka object
let activeBots = {};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);

    try {
      // 1. Patha messages load cheyadam
      const messages = await Message.find({ room: room });
      socket.emit("previous_messages", messages);

      // 2. 🔥 Funny Bot Logic - Start only if not active in this room
      if (!activeBots[room]) {
        activeBots[room] = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * funnyDialogues.length);
          const botMsg = {
            author: "Broker BOT 🤖",
            message: funnyDialogues[randomIndex],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase(),
            _id: "bot-" + Date.now(),
            room: room
          };
          io.to(room).emit("receive_message", botMsg);
        }, 60000); // 1 minute interval
      }

    } catch (err) {
      console.log("Error in join_room:", err);
    }
  });

  // Typing signals
  socket.on("typing", (data) => {
    socket.to(data.room).emit("display_typing", data.username);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.room).emit("hide_typing");
  });

  // Delete Message logic
  socket.on("delete_message", async (data) => {
    try {
      await Message.findByIdAndDelete(data.id);
      io.to(data.room).emit("message_deleted", data.id);
    } catch (err) {
      console.log(err);
    }
  });

  // Send Message logic
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

server.listen(3001, () => {
  console.log("SERVER RUNNING ON PORT 3001");
});