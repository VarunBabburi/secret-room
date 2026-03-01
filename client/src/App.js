import "./App.css";
import io from "socket.io-client";
import EmojiPicker from 'emoji-picker-react';
import { useState, useEffect, useRef } from "react";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [typingStatus, setTypingStatus] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollRef = useRef();

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowWelcome(true); 

      // 3 seconds splash screen tharuvatha chat open avthundi
      setTimeout(() => {
        setShowWelcome(false);
        setShowChat(true);
      }, 3000); 
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prevInput) => prevInput + emojiObject.emoji);
  };

  const deleteMessage = (id) => {
    if (window.confirm("Ee message delete cheyamantava mama?")) {
      socket.emit("delete_message", { id, room });
      setMessageList((list) => list.filter((msg) => msg._id !== id));
    }
  };

  const sendMessage = async () => {
    if (message !== "") {
      const time = new Date().toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      }).toLowerCase();

      const messageData = {
        room: room,
        author: username,
        message: message,
        time: time,
      };

      await socket.emit("send_message", messageData);
      setMessage("");
      setShowEmojiPicker(false);
      socket.emit("stop_typing", { room });
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (e.target.value !== "") {
      socket.emit("typing", { username, room });
    } else {
      socket.emit("stop_typing", { room });
    }
  };
    // Chat nundi bayataki vachi Join Screen ki velladaniki
      const exitChat = () => {
       window.location.reload(); // Deenivalla socket disconnect ayyi malli fresh ga join screen osthundi
      };
  useEffect(() => {
    socket.on("previous_messages", (messages) => setMessageList(messages));
    
    socket.on("receive_message", (data) => {
      // Chat lo "SYSTEM" message rakunda ikkada condition check chesthunnam
      if (data.author !== "SYSTEM") {
        setMessageList((list) => [...list, data]);
      }
    });

    socket.on("message_deleted", (id) => {
      setMessageList((list) => list.filter((msg) => msg._id !== id));
    });

    socket.on("display_typing", (user) => setTypingStatus(`${user} is typing...`));
    socket.on("hide_typing", () => setTypingStatus(""));

    return () => {
      socket.off("previous_messages");
      socket.off("receive_message");
      socket.off("message_deleted");
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, []);

  // 🔥 Fix: Auto-scroll correct trigger
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, typingStatus, showChat]);

  return (
    <div className="App">
      {!showChat && !showWelcome ? (
        <div className="joinChatContainer">
          <h3>Secret Chat Circle</h3>
          <p className="dev-credit">Developed with 🩵 by <b>Varun</b></p>
          <input type="text" placeholder="Nee Peru..." onChange={(e) => setUsername(e.target.value)} />
          <input type="text" placeholder="Room ID..." onChange={(e) => setRoom(e.target.value)} />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : showWelcome ? (
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1 className="glow-text">🚀 Welcome to</h1>
            <h2 className="brand-name">VARUN'S PREMIUM CHAT</h2>
            <div className="loading-bar"></div>
            <p>Connecting to Room {room}...</p>
          </div>
        </div>
      ) : (
        <div className="chat-window">
         <div className="chat-header">
            <div className="header-left">
                     {/* 🔙 Back Button */}
                    <button className="back-btn" onClick={exitChat}>
                              ←
                         </button>
            {/* <div className="header-info"> */}
              <div className="header-text">
                <p>Live Chat Room {room}</p>
              </div>
            </div>
            <div className="app-brand">Varun's Den</div> 
          </div>
          
          <div className="chat-body">
            {messageList.map((msgContent, index) => (
              <div className="message" key={index} id={username === msgContent.author ? "you" : "other"}>
                <div className="message-box">
                  <div className="message-content">
                    {username !== msgContent.author && (
                      <span className={`message-author-name ${msgContent.author.includes("BOT") ? "bot-label" : ""}`}>
                          {msgContent.author}
                        {msgContent.author.toLowerCase() === "varun" && (
                          <span className="verified-tick">●</span> 
                        )}
                      </span>
                    )}
                    <p>
                      {msgContent.message}
                      <span className="message-meta-inline">
                        {msgContent.time} 
                        {username === msgContent.author && <span className="blue-ticks"> ✓✓</span>}
                      </span>
                    </p>
                    {username === msgContent.author && msgContent._id && (
                      <button className="delete-btn-abs" onClick={() => deleteMessage(msgContent._id)}>🗑️</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {typingStatus && (
              <div className="typing-indicator-wrapper">
                <div className="typing-indicator">
                   {typingStatus} <span className="typing-dots"></span>
                </div>
              </div>
            )}
            <div ref={scrollRef}></div>
          </div>

          <div className="chat-footer">
            <button className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
            {showEmojiPicker && (
              <div className="emoji-container">
                <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
              </div>
            )}
            <input
              type="text"
              value={message}
              placeholder="Type message..."
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>&#9658;</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
