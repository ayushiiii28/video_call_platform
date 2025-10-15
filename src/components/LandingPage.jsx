import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function LandingPage() {
  const [roomId, setRoomId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthed, setIsAuthed] = useState(!!sessionStorage.getItem("access_token"));
  const navigate = useNavigate();
  const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8000";

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId) {
      setErrorMessage("");
      navigate(`/prejoin/${roomId}`);
    } else {
      setErrorMessage("Please enter a meeting code.");
    }
  };

  const handleInstantMeeting = async () => {
    setErrorMessage("");
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/v1/sessions/start`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const maybeJson = await response.json().catch(() => null);
        const detail = maybeJson?.detail || "Failed to start an instant meeting.";
        throw new Error(Array.isArray(detail) ? detail[0]?.msg || "Failed to start an instant meeting." : detail);
      }
      const data = await response.json();
      const createdRoomId = data?.room_id || data?.data?.room_id;
      const createdSessionId = data?.session_id || data?.data?.session_id || data?.id; // SessionOut alias
      if (!createdRoomId || !createdSessionId) {
        throw new Error("Server did not return a room_id.");
      }
      navigate(`/prejoin/${createdSessionId}`);
    } catch (e) {
      setErrorMessage(e?.message || "Unexpected error starting meeting.");
    }
  };

  // New handler for scheduling a meeting
  const handleScheduleMeeting = () => {
    navigate("/schedule");
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleLogIn = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("token_type");
    setIsAuthed(false);
    navigate("/");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#A3AFEF", // Main background color
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Left section for text and inputs */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "2rem",
          paddingLeft: "8%",
          width: "50%",
        }}
      >
        <h2 style={{ color: "black", marginBottom: "1rem" }}>Zynthora AI</h2> {/* Black */}
        <h1
          style={{
            fontSize: "4rem",
            fontWeight: "bold",
            color: "white", // White
            textAlign: "left",
            margin: "2rem 0",
            lineHeight: "1.2",
          }}
        >
          Video Call or Team Meet?
        </h1>

        {/* Auth buttons: show Sign Up / Log In if not authenticated; show Logout if authenticated */}
        {!isAuthed ? (
          <div style={{ display: "flex", gap: "2rem", margin: "2rem 0" }}>
            <button
              onClick={handleSignUp}
              style={{
                padding: "0.5rem 2rem",
                fontSize: "1rem",
                borderRadius: "5px",
                border: "1px solid black",
                backgroundColor: "black",
                color: "white",
                cursor: "pointer",
              }}
            >
              Sign Up
            </button>
            <button
              onClick={handleLogIn}
              style={{
                padding: "0.5rem 2rem",
                fontSize: "1rem",
                borderRadius: "5px",
                border: "1px solid #1E1E1E",
                backgroundColor: "#1E1E1E",
                color: "white",
                cursor: "pointer",
              }}
            >
              Log In
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "2rem", margin: "2rem 0" }}>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.5rem 2rem",
                fontSize: "1rem",
                borderRadius: "5px",
                border: "1px solid #c53030",
                backgroundColor: "#c53030",
                color: "white",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        )}

        {/* Meeting code input and instant meeting button */}
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "black", marginBottom: "0.5rem" }}> {/* Black */}
            Meeting Code:
          </h3>
          <form onSubmit={handleJoinRoom} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <input
              type="text"
              placeholder="Enter meeting code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{
                padding: "0.5rem",
                width: "300px",
                height: "40px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#C3CCFC", // Adjusted secondary color
                color: "black", // Input text color
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.5rem 2rem",
                fontSize: "1rem",
                borderRadius: "5px",
                border: "1px solid #1E1E1E", // Changed border to match button color
                backgroundColor: "#1E1E1E", // Join button is #1E1E1E
                color: "white", // Changed text color to white for contrast
                cursor: "pointer",
              }}
            >
              Join
            </button>
          </form>
          {errorMessage && <p style={{ color: "#FF6347", marginTop: "0.5rem" }}>{errorMessage}</p>}
        </div>

        {/* Buttons for Instant and Schedule Meeting */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          <button
            onClick={handleInstantMeeting}
            style={{
              padding: "0.75rem 2.5rem",
              fontSize: "1.2rem",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "black", // Start instant meeting button is black
              color: "white",
              cursor: "pointer",
            }}
          >
            Start instant meeting
          </button>
          {/* New Schedule Meet Button */}
          <button
            onClick={handleScheduleMeeting}
            style={{
              padding: "0.75rem 2.5rem",
              fontSize: "1.2rem",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#1E1E1E", // Schedule Meet button is #1E1E1E
              color: "white", // Changed text color to white for contrast
              cursor: "pointer",
            }}
          >
            Schedule Meet 🗓️
          </button>
        </div>
      </div>

      {/* Right section for the image */}
      <div
        style={{
          width: "50%",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src="https://placehold.co/600x400/2e4242/fff?text=Video+Call"
          alt="Video call interface"
          style={{
            width: "90%",
            height: "auto",
            objectFit: "cover",
            borderRadius: "10px",
          }}
        />
      </div>
    </div>
  );
}

export default LandingPage;