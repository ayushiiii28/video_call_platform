// PreJoin.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function PreJoin() {
  const { roomId } = useParams();
  const [name, setName] = useState("");
  const [stream, setStream] = useState(null);
  const userVideo = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        userVideo.current.srcObject = mediaStream;
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
        alert("Please allow camera and microphone access to join the room.");
      });
  }, []);

  const joinRoom = () => {
    if (!name) return alert("Enter your name");
    navigate(`/room/${roomId}`, { state: { name, stream } });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#2A402D",
        color: "#93B294",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          backgroundColor: "#1E1F21",
        }}
      >
        <div style={{ padding: "0.5rem 1rem", backgroundColor: "#1E1F21", color: "white" }}>
          Meeting Code
        </div>
        <div style={{ padding: "0.5rem 1rem", backgroundColor: "#1E1F21", color: "white" }}>
          Meeting Title
        </div>
        <div style={{ padding: "0.5rem 1rem", backgroundColor: "#1E1F21", color: "white" }}>
          Host Name
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          padding: "2rem",
          justifyContent: "center",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "1rem",
            width: "20%",
            minWidth: "200px",
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0", color: "#93B294" }}>Already in meet:</h3>
          <div style={{ width: "100%", height: "80px", backgroundColor: "#1E1F21", borderRadius: "5px", marginBottom: "1rem" }}>
            {/* Placeholder for joined participants */}
          </div>
          <label style={{ color: "white", marginBottom: "0.5rem" }}>Enter Name</label>
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "0.5rem",
              width: "100%",
              borderRadius: "5px",
              border: "1px solid #93B294",
              backgroundColor: "#1E1F21",
              color: "white",
              marginBottom: "1rem",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", color: "white", marginBottom: "1rem" }}>
            <input type="checkbox" style={{ marginRight: "0.5rem" }} />
            Remember your name
          </label>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#93B294" }}>Background</h3>
          <div style={{ width: "100%", height: "100px", border: "1px solid #93B294", backgroundColor: "#1E1F21", borderRadius: "5px" }}>
            {/* Background preview */}
          </div>
        </div>

        {/* Central Video Section */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            minWidth: "400px",
            maxWidth: "700px",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
          }}
        >
          <video
            ref={userVideo}
            autoPlay
            muted
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        {/* Right Sidebar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "1rem",
            width: "20%",
            minWidth: "200px",
          }}
        >
          <label style={{ color: "white", marginBottom: "0.5rem" }}>Select Your Language</label>
          <select
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "5px",
              border: "1px solid #93B294",
              backgroundColor: "#1E1F21",
              color: "white",
              marginBottom: "1rem",
            }}
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
          <label style={{ color: "white", marginBottom: "0.5rem" }}>Camera</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
            <span>On</span>
            <div style={{ width: "40px", height: "20px", backgroundColor: "#93B294", borderRadius: "20px" }}>
              {/* Toggle switch placeholder */}
            </div>
            <span>Off</span>
          </div>
          <label style={{ color: "white", marginBottom: "0.5rem" }}>Microphone</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>On</span>
            <div style={{ width: "40px", height: "20px", backgroundColor: "#93B294", borderRadius: "20px" }}>
              {/* Toggle switch placeholder */}
            </div>
            <span>Off</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          backgroundColor: "#1E1F21",
        }}
      >
        <div style={{ color: "#93B294", fontSize: "1.2rem", fontWeight: "bold" }}>Meeting Room</div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={joinRoom}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#6D8A78",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Join Now
          </button>
          <button
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "transparent",
              color: "#6D8A78",
              border: "1px solid #6D8A78",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreJoin;