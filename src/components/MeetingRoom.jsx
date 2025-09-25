import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { name, cameraOn, micOn } = location.state || {};
  const [stream, setStream] = useState(null);
  const userVideo = useRef();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // If we don't have the user's name, redirect them back to the pre-join screen.
    if (!name) {
      navigate(`/prejoin/${roomId}`);
      return;
    }

    let currentStream = null;
    navigator.mediaDevices.getUserMedia({ video: cameraOn, audio: micOn })
      .then((mediaStream) => {
        currentStream = mediaStream;
        setStream(mediaStream);
        if (userVideo.current) {
          userVideo.current.srcObject = mediaStream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices in room.", error);
        setErrorMessage("Could not access your camera or microphone. Please ensure permissions are granted and try again.");
      });

    // Cleanup function to stop the stream when the component unmounts
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [name, cameraOn, micOn, roomId, navigate]);

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
          flexWrap: "wrap",
        }}
      >
        {/* User Video Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            minWidth: "300px",
            maxWidth: "600px",
            width: "100%",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
          }}
        >
          <video ref={userVideo} autoPlay muted style={{ width: "100%", height: "auto", display: "block" }} />
          <div style={{ position: "absolute", bottom: "1rem", left: "1rem", color: "white", backgroundColor: "rgba(0,0,0,0.5)", padding: "0.25rem 0.5rem", borderRadius: "5px" }}>
            {name}
          </div>
        </div>
        {errorMessage && <p style={{ color: "#FF6347", textAlign: "center", marginTop: "1rem" }}>{errorMessage}</p>}
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem 2rem",
          backgroundColor: "#1E1F21",
          gap: "1rem",
        }}
      >
        <button
          onClick={() => {
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
            navigate(`/prejoin/${roomId}`);
          }}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#FF6347",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
}

export default Room;