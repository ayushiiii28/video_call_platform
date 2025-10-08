import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Schedule() {
  const navigate = useNavigate();
  const [meetingDetails, setMeetingDetails] = useState({
    title: "",
    attendee: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    whoCanEnter: "Anyone with the link", // Default value for dropdown
    repeat: "Never", // Default value for dropdown
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMeetingDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send meetingDetails to a backend API here.
    console.log("Scheduling Meeting:", meetingDetails);
    alert("Meeting Scheduled! (Check console for details)");
    // After scheduling, you might navigate the user to a confirmation page or back to the landing page.
    navigate("/");
  };

  const inputStyle = {
    padding: "0.75rem",
    margin: "0.5rem 0",
    borderRadius: "5px",
    border: "1px solid #444",
    backgroundColor: "#333",
    color: "white",
    width: "100%",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    margin: "1.5rem 0 0",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#6D8A78", // Matching the instant meeting button's color
    color: "white",
    cursor: "pointer",
    width: "100%", // Full width for the "Done" button
  };
  
  const dateTimeControlStyle = {
    padding: "0.75rem",
    margin: "0.5rem 0.5rem 0.5rem 0",
    borderRadius: "5px",
    border: "1px solid #444",
    backgroundColor: "#333",
    color: "white",
    // Adjust width for two controls per line
    width: "calc(50% - 0.5rem)", 
    boxSizing: "border-box",
  };
  
  const selectStyle = {
    ...inputStyle,
    appearance: "none", // Remove default dropdown arrow for better dark mode look
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23fff'%3e%3cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    backgroundSize: "0.65rem",
    paddingRight: "2.5rem", // Add space for the custom arrow
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#1D2C2A", // Background color from LandingPage
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#111", // Darker panel background
          padding: "2rem",
          borderRadius: "10px",
          width: "400px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
          color: "white",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem", color: "#E8E7E5" }}>
          Schedule A Meet
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <label style={{ display: "block", color: "#bbb", marginBottom: "0.2rem" }}>Title:</label>
          <input
            type="text"
            name="title"
            value={meetingDetails.title}
            onChange={handleChange}
            style={inputStyle}
          />

          {/* Attendee/Email */}
          <label style={{ display: "block", color: "#bbb", marginBottom: "0.2rem" }}>Enter Name or Email</label>
          <input
            type="text"
            name="attendee"
            value={meetingDetails.attendee}
            onChange={handleChange}
            style={inputStyle}
          />
          
          {/* Start Date and Time */}
          <div style={{ display: "flex", gap: "1rem" }}>
             <input
              type="date"
              name="startDate"
              value={meetingDetails.startDate}
              onChange={handleChange}
              style={{ ...dateTimeControlStyle, marginRight: "0" }} // Override margin for the date
            />
             <input
              type="time"
              name="startTime"
              value={meetingDetails.startTime}
              onChange={handleChange}
              style={{ ...dateTimeControlStyle, marginLeft: "0" }} // Override margin for the time
            />
          </div>
          
          {/* End Date and Time (Assuming the screenshot implies a date range) */}
          <div style={{ display: "flex", gap: "1rem" }}>
             <input
              type="date"
              name="endDate"
              value={meetingDetails.endDate}
              onChange={handleChange}
              style={{ ...dateTimeControlStyle, marginRight: "0" }} 
            />
             <input
              type="time"
              name="endTime"
              value={meetingDetails.endTime}
              onChange={handleChange}
              style={{ ...dateTimeControlStyle, marginLeft: "0" }} 
            />
          </div>

          {/* Who can enter meet? */}
          <label style={{ display: "block", color: "#bbb", marginTop: "1rem", marginBottom: "0.2rem" }}>Who can enter meet?</label>
          <select
            name="whoCanEnter"
            value={meetingDetails.whoCanEnter}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="Anyone with the link">Anyone with the link</option>
            <option value="Only invited users">Only invited users</option>
            <option value="Only logged-in users">Only logged-in users</option>
          </select>

          {/* Repeat the Meet? */}
          <label style={{ display: "block", color: "#bbb", marginTop: "1rem", marginBottom: "0.2rem" }}>Repeat the Meet ?</label>
          <select
            name="repeat"
            value={meetingDetails.repeat}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="Never">Never</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>

          {/* Done Button */}
          <button type="submit" style={buttonStyle}>
            Done
          </button>
        </form>
      </div>
    </div>
  );
}

export default Schedule;