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

// 🚀 Socket.io setup with Production Settings
const io = new Server(server, {
  cors: {
    origin: "*", // Live lo andhariki access ivvadaniki
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {} // Connection drop ayithe automatic ga recover chesthundhi
});

// 💥 MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected Mama! 💥"))
  .catch((err) => console.log("DB Connection Error:", err));

// 🔥 Funny Bot Dialogues
const funnyDialogues = [
  "Evadra nuvvu intha silent ga unnav? Nuv Mogonivi ayithe mesg chey ra!",
  "Arey, evaraina matladandra babu.. lekapothe naku BP lethadhi!",
  "Em mama, andaru silent ayipoyaru? Evariki na weakness lu gurthu osthaleva.. ?",
  "Orey, ekkadunnav ra? Nee kosam ikkada andaru waiting!",
  "Varun App ante aa mathram premium untadhi mari.. enjoy pandago!",
  "Chatting cheyyandi ra ante, group lo andaru nidrapothunnara?",
  "Enti mama.. message cheyadaniki entha show chethanav?"
];

// Room-wise bot control
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

      // 2. 🔥 Funny Bot Logic
      if (!activeBots[room]) {
        activeBots[room] = setInterval(() => {
          // Room lo users evaraina unnara ani check cheyali (Empty room lo bot avasaram ledhu)
          const clients = io.sockets.adapter.rooms.get(room);
          if (clients && clients.size > 0) {
            const randomIndex = Math.floor(Math.random() * funnyDialogues.length);
            const botMsg = {
              author: "Broker BOT 🤖",
              message: funnyDialogues[randomIndex],
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase(),
              _id: "bot-" + Date.now(),
              room: room
            };
            io.to(room).emit("receive_message", botMsg);
          } else {
            // Evaru lekapothe interval clear cheseyali (Server load thaggadaniki)
            clearInterval(activeBots[room]);
            delete activeBots[room];
          }
        }, 150000); // 1 minute interval
      }

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

// 🌍 Dynamic Port for Render Deployment
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT} MAMA! 🚀`);
});