import "./App.css";
import io from "socket.io-client";
import { useState } from "react";
import Chat from "./Chat";

const DEFAULT_ROOM = "VIP";
const socket = io.connect("http://localhost:8686/client");

function App() {
  const [username, setUsername] = useState("");
  const [showChat, setShowChat] = useState(false);

  const pongToServer = () => {
    if (username !== "") {
      socket.emit("join_server", DEFAULT_ROOM);
      setShowChat(true);
    }
  };

  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
          <h3>Awesome Server</h3>
          <input
            type="text"
            placeholder="Username..."
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <button onClick={pongToServer}>Connect</button>
        </div>
      ) : (
        <Chat socket={socket} username={username} />
      )}
    </div>
  );
}

export default App;