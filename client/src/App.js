import "./App.css";
import io from "socket.io-client";
import EmojiPicker from 'emoji-picker-react';
import { useState, useEffect, useRef } from "react";
import SwipeableMessage from './TouchSwipeableMessage';

const socket = io.connect(process.env.REACT_APP_BACKEND_URL || "https://secret-room-8ax7.onrender.com");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [typingStatus, setTypingStatus] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

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
        replyTo: replyingTo ? {
          messageId: replyingTo._id,
          author: replyingTo.author,
          message: replyingTo.message
        } : null
      };

      await socket.emit("send_message", messageData);
      setMessage("");
      setReplyingTo(null);
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
          {/* <p className="dev-credit"><b>Developed with 🖤 by Varun</b></p> */}
          <input type="text" placeholder="Full Name..." onChange={(e) => setUsername(e.target.value)} />
          <input type="text" placeholder="Room ID..." onChange={(e) => setRoom(e.target.value)} />
          <button onClick={joinRoom}>Join Room</button>
          <div className="corporate-footer">
    
    <p className="rights-text">© 2026 Varun Systems & Technologies Pvt. Ltd.</p>
  </div>
        </div>
      ) : showWelcome ? (
        <div className="welcome-screen">
  <div className="welcome-content">

    <div className="security-icon">🔒</div>

    <h1 className="secure-title">Secure Chat</h1>

    <p className="secure-subtitle">
      Joining your private room
    </p>

    <div className="room-badge">
      Room: <strong>{room}</strong>
    </div>

    <div className="secure-loader">
      <div className="secure-loader-line"></div>
     
    </div>

    <p className="connection-status">
      Establishing secure connection...
    </p>

  </div>
</div>
      ) : (
        <div className="chat-window">
         <div className="chat-header">
            <div className="header-left">
                     {/* 🔙 Back Button */}
                    {/* <button className="back-btn" onClick={exitChat}>
                              ←
                         </button> */}
            {/* <div className="header-info"> */}
            <div className="room-avatar">
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="32"
      cy="21"
      r="9"
      
     fill="#e8e2ef"
      // fill="#9B7CFF"
    />

    <path
      d="M16 48c0-8.5 7.2-14 16-14s16 5.5 16 14"
      fill="#e3e0ea"
      //fill="#9B7CFF"
    />
  </svg>
</div>
              <div className="header-text">
                <p> Live Chat Room {room}</p>
              </div>
            </div>
            
            
           <button className="back-btn" onClick={exitChat} aria-label="Go to home">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className="home-icon"
  >
    <path d="M 16 2.59375 L 15.28125 3.28125 L 2.28125 16.28125 L 3.71875 17.71875 L 5 16.4375 L 5 28 L 14 28 L 14 18 L 18 18 L 18 28 L 27 28 L 27 16.4375 L 28.28125 17.71875 L 29.71875 16.28125 L 16.71875 3.28125 Z M 16 5.4375 L 25 14.4375 L 25 26 L 20 26 L 20 16 L 12 16 L 12 26 L 7 26 L 7 14.4375 Z" />
  </svg>
</button>
            {/* <div className="app-brand">Varun's Den</div>  */}
          </div>
          
          <div className="chat-body">
            {messageList.map((msgContent, index) => (
              <SwipeableMessage
    key={index}
    onSwipeRight={() => setReplyingTo(msgContent)} 
  >
              <div className="message" key={index} id={username === msgContent.author ? "you" : "other"} onDoubleClick={() => setReplyingTo(msgContent)} 
    style={{ cursor: "pointer" }}>
                <div className="message-box">
                  <div className="message-content">
                    {username !== msgContent.author && (
                      <span className={`message-author-name ${msgContent.author.includes("BOT") ? "bot-label" : ""}`}>
                          {msgContent.author}
                        {msgContent.author.toLowerCase() === "Varun" && (
                          <span className="verified-tick">●</span> 
                        )}
                      </span>
                    )}
                    {msgContent.replyTo && (
                        <div className="quoted-reply">
                          <small><b>{msgContent.replyTo.author}</b></small>
                          <p>{msgContent.replyTo.message}</p>
                        </div>
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
              </SwipeableMessage>
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

          {replyingTo && (
            <div className="reply-preview-bar">
              <div className="reply-info">
                <small>Replying to <b>{replyingTo.author}</b></small>
                <p>{replyingTo.message}</p>
              </div>
              <button className="close-reply-btn" onClick={() => setReplyingTo(null)}>
                ✖
              </button>
            </div>
          )}

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
