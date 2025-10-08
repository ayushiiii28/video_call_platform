import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import PreJoin from "./components/PreJoin.jsx";
import MeetingRoom from "./components/MeetingRoom.jsx";
import Login from "./components/login.jsx";
import Signup from "./components/signup.jsx";
import Schedule from "./components/Schedule.jsx"; // 👈 Import the new component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* 👇 New Route for the Scheduling Page */}
        <Route path="/schedule" element={<Schedule />} /> 
        <Route path="/prejoin/:roomId" element={<PreJoin />} />
        <Route path="/room/:roomId" element={<MeetingRoom />} />
      </Routes>
    </Router>
  );
}

export default App;