import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function PreJoin() {
  const { roomId } = useParams();
  const [name, setName] = useState("");
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const userVideo = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    let currentStream = null;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        currentStream = mediaStream;
        setStream(mediaStream);
        if (userVideo.current) {
          userVideo.current.srcObject = mediaStream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
        setErrorMessage("Please allow camera and microphone access to join the room.");
      });

    // Cleanup function to stop the stream when the component unmounts
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once

  // Toggle Camera
  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const joinRoom = () => {
    if (!name) {
      setErrorMessage("Please enter your name.");
      return;
    }
    setErrorMessage("");
    // We are no longer passing the stream via state, as it's not a reliable method.
    // The next component will be responsible for re-acquiring the media stream.
    navigate(`/room/${roomId}`, { state: { name, cameraOn, micOn } });
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
          Meeting Code: {roomId}
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
          <div style={{ width: "100%", height: "80px", backgroundColor: "#1E1F21", borderRadius: "5px", marginBottom: "1rem" }} />
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
          <div style={{ width: "100%", height: "100px", border: "1px solid #93B294", backgroundColor: "#1E1F21", borderRadius: "5px" }} />
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
          <video ref={userVideo} autoPlay muted style={{ width: "100%", height: "auto", display: "block" }} />
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

          {/* Camera Toggle */}
          <label style={{ color: "white", marginBottom: "0.5rem" }}>Camera</label>
          <div
            onClick={toggleCamera}
            style={{
              cursor: "pointer",
              width: "50px",
              height: "25px",
              borderRadius: "20px",
              backgroundColor: cameraOn ? "#4caf50" : "#ccc",
              position: "relative",
              marginBottom: "1rem",
              transition: "background-color 0.2s",
            }}
          >
            <div
              style={{
                width: "23px",
                height: "23px",
                borderRadius: "50%",
                backgroundColor: "white",
                position: "absolute",
                top: "1px",
                left: cameraOn ? "26px" : "1px",
                transition: "all 0.2s",
              }}
            />
          </div>

          {/* Microphone Toggle */}
          <label style={{ color: "white", marginBottom: "0.5rem" }}>Microphone</label>
          <div
            onClick={toggleMic}
            style={{
              cursor: "pointer",
              width: "50px",
              height: "25px",
              borderRadius: "20px",
              backgroundColor: micOn ? "#4caf50" : "#ccc",
              position: "relative",
              transition: "background-color 0.2s",
            }}
          >
            <div
              style={{
                width: "23px",
                height: "23px",
                borderRadius: "50%",
                backgroundColor: "white",
                position: "absolute",
                top: "1px",
                left: micOn ? "26px" : "1px",
                transition: "all 0.2s",
              }}
            />
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
      {errorMessage && <p style={{ color: "#FF6347", textAlign: "center", marginTop: "1rem" }}>{errorMessage}</p>}
    </div>
  );
}

export default PreJoin;