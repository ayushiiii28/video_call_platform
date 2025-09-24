// LandingPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import landingPageImage from "./landing_page_image.png"; // Make sure this path is correct

function LandingPage() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId) {
      navigate(`/prejoin/${roomId}`);
    } else {
      alert("Please enter a meeting code.");
    }
  };

  const handleSignUp = () => {
    navigate("/signup"); // Navigate to Signup page
  };

  const handleLogIn = () => {
    navigate("/login"); // Navigate to Login page
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#1D2C2A",
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
        <h2 style={{ color: "#E8E7E5", marginBottom: "1rem" }}>Zynthora AI</h2>
        <h1
          style={{
            fontSize: "4rem",
            fontWeight: "bold",
            color: "#6D8A78",
            textAlign: "left",
            margin: "2rem 0",
            lineHeight: "1.2",
          }}
        >
          Video Call or Team Meet?
        </h1>

        {/* Login / Signup buttons */}
        <div style={{ display: "flex", gap: "2rem", margin: "2rem 0" }}>
          <button
            onClick={handleSignUp}
            style={{
              padding: "0.5rem 2rem",
              fontSize: "1rem",
              borderRadius: "5px",
              border: "1px solid #E8E7E5",
              backgroundColor: "#1D2C2A",
              color: "#E8E7E5",
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
              border: "1px solid #E8E7E5",
              backgroundColor: "#1D2C2A",
              color: "#E8E7E5",
              cursor: "pointer",
            }}
          >
            Log In
          </button>
        </div>

        {/* Meeting code input */}
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#6D8A78", marginBottom: "0.5rem" }}>
            Meeting Code:
          </h3>
          <form onSubmit={handleJoinRoom}>
            <input
              type="text"
              placeholder=""
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{
                padding: "0.5rem",
                width: "300px",
                height: "40px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#2E4242",
                color: "white",
              }}
            />
          </form>
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
          src={landingPageImage}
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