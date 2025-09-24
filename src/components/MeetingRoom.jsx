// MeetingRoom.js
import React from "react";
import { useLocation, useParams } from "react-router-dom";

function MeetingRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const { name, stream } = location.state || {};

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Meeting Room: {roomId}</h1>
      <h2>Welcome, {name}</h2>
      <video autoPlay muted ref={video => { if(video) video.srcObject = stream }} style={{ width: "300px" }} />
      {/* Video calls with peers will go here */}
    </div>
  );
}

export default MeetingRoom;
