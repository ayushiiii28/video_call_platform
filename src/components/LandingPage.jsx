import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function LandingPage() {
    const [roomId, setRoomId] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Initial check
    const navigate = useNavigate();

    // Effect to handle window resize events and update isMobile state
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (roomId) {
            setErrorMessage("");
            navigate(`/prejoin/${roomId}`);
        } else {
            setErrorMessage("Please enter a meeting code.");
        }
    };

    const handleInstantMeeting = () => {
        const newRoomId = uuidv4();
        navigate(`/prejoin/${newRoomId}`);
    };

    const handleScheduleMeeting = () => {
        navigate("/schedule");
    };

    const handleSignUp = () => {
        navigate("/signup");
    };

    const handleLogIn = () => {
        navigate("/login");
    };

    // ---------------------------------------------
    // DYNAMIC STYLES BASED ON isMobile STATE
    // ---------------------------------------------

    // Main Container Style
    const mainContainerStyle = {
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // Stack vertically on mobile
        justifyContent: isMobile ? "flex-start" : "space-between",
        alignItems: isMobile ? "center" : "center",
        minHeight: "100vh", // Use minHeight for vertical stacking on mobile
        backgroundColor: "#A3AFEF",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: isMobile ? "1rem 0" : "0", // Add padding on mobile, none on desktop
        boxSizing: "border-box",
        overflowY: isMobile ? "auto" : "hidden", // Allow scrolling on mobile
    };

    // Left Content Section Style
    const contentSectionStyle = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: isMobile ? "center" : "flex-start", // Center content on mobile
        padding: isMobile ? "1.5rem" : "2rem",
        paddingLeft: isMobile ? "1.5rem" : "8%",
        width: isMobile ? "100%" : "50%", // Full width on mobile
        order: isMobile ? 2 : 1, // Move content below image on mobile (optional preference)
        textAlign: isMobile ? "center" : "left", // Center text on mobile
    };

    // Right Image Section Style
    const imageSectionStyle = {
        width: isMobile ? "100%" : "50%", // Full width on mobile
        height: isMobile ? "auto" : "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: isMobile ? "1rem 0" : "0",
        order: isMobile ? 1 : 2, // Move image to the top on mobile
    };
    
    // Main Title Style
    const mainTitleStyle = {
        fontSize: isMobile ? "2.5rem" : "4rem", // Smaller font size on mobile
        fontWeight: "bold",
        color: "white",
        textAlign: isMobile ? "center" : "left",
        margin: isMobile ? "1rem 0" : "2rem 0",
        lineHeight: "1.2",
        maxWidth: isMobile ? "90%" : "none",
    };

    // Button and Form Layouts
    const rowGapStyle = {
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // Stack buttons vertically on mobile
        gap: isMobile ? "0.75rem" : "2rem",
        margin: isMobile ? "1rem 0" : "2rem 0",
        width: isMobile ? "100%" : "auto", // Take full width on mobile
        justifyContent: isMobile ? "center" : "flex-start",
        alignItems: "center",
    };

    const formStyle = {
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // Stack input and join button
        alignItems: "center",
        gap: isMobile ? "0.5rem" : "1rem",
    };
    
    // Input Style
    const inputStyle = {
        padding: "0.5rem",
        width: isMobile ? "90%" : "300px", // Full width on mobile
        maxWidth: "300px",
        height: "40px",
        borderRadius: "5px",
        border: "none",
        backgroundColor: "#C3CCFC",
        color: "black",
    };

    // ---------------------------------------------
    // RENDER
    // ---------------------------------------------

    return (
        <div style={mainContainerStyle}>
            {/* Left section (Content) */}
            <div style={contentSectionStyle}>
                <h2 style={{ color: "black", marginBottom: "1rem" }}>Zynthora AI</h2>
                <h1 style={mainTitleStyle}>
                    Video Call or Team Meet?
                </h1>

                {/* Login / Signup buttons */}
                <div style={rowGapStyle}>
                    <button
                        onClick={handleSignUp}
                        style={{
                            ...buttonBaseStyle,
                            backgroundColor: "black",
                            width: isMobile ? "90%" : "auto", // Full width on mobile
                        }}
                    >
                        Sign Up
                    </button>
                    <button
                        onClick={handleLogIn}
                        style={{
                            ...buttonBaseStyle,
                            backgroundColor: "#1E1E1E",
                            border: "1px solid #1E1E1E",
                            width: isMobile ? "90%" : "auto", // Full width on mobile
                        }}
                    >
                        Log In
                    </button>
                </div>

                {/* Meeting code input and instant meeting button */}
                <div style={{ marginTop: isMobile ? "1rem" : "2rem", width: isMobile ? "100%" : "auto", textAlign: isMobile ? "center" : "left" }}>
                    <h3 style={{ color: "black", marginBottom: "0.5rem" }}>
                        Meeting Code:
                    </h3>
                    <form onSubmit={handleJoinRoom} style={formStyle}>
                        <input
                            type="text"
                            placeholder="Enter meeting code"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            style={inputStyle}
                        />
                        <button
                            type="submit"
                            style={{
                                ...buttonBaseStyle,
                                padding: "0.5rem 2rem",
                                fontSize: "1rem",
                                backgroundColor: "#1E1E1E",
                                border: "1px solid #1E1E1E",
                                width: isMobile ? "90%" : "auto",
                            }}
                        >
                            Join
                        </button>
                    </form>
                    {errorMessage && <p style={{ color: "#FF6347", marginTop: "0.5rem" }}>{errorMessage}</p>}
                </div>

                {/* Buttons for Instant and Schedule Meeting */}
                <div style={rowGapStyle}>
                    <button
                        onClick={handleInstantMeeting}
                        style={{
                            ...instantScheduleButtonBaseStyle,
                            backgroundColor: "black",
                            width: isMobile ? "90%" : "auto",
                        }}
                    >
                        Start instant meeting
                    </button>
                    <button
                        onClick={handleScheduleMeeting}
                        style={{
                            ...instantScheduleButtonBaseStyle,
                            backgroundColor: "#1E1E1E",
                            width: isMobile ? "90%" : "auto",
                        }}
                    >
                        Schedule Meet 🗓️
                    </button>
                </div>
            </div>

            {/* Right section (Image) */}
            <div style={imageSectionStyle}>
                <img
                    src="https://placehold.co/600x400/2e4242/fff?text=Video+Call"
                    alt="Video call interface"
                    style={{
                        width: isMobile ? "80%" : "90%", // Smaller image on mobile
                        height: "auto",
                        objectFit: "cover",
                        borderRadius: "10px",
                        margin: isMobile ? "2rem 0" : "0",
                    }}
                />
            </div>
        </div>
    );
}

// Reusable base styles for cleaner code
const buttonBaseStyle = {
    padding: "0.5rem 2rem",
    fontSize: "1rem",
    borderRadius: "5px",
    color: "white",
    cursor: "pointer",
    border: "none",
};

const instantScheduleButtonBaseStyle = {
    padding: "0.75rem 2.5rem",
    fontSize: "1.2rem",
    borderRadius: "5px",
    color: "white",
    cursor: "pointer",
    border: "none",
};

export default LandingPage;