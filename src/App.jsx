import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import PreJoin from "./components/PreJoin.jsx";
import MeetingRoom from "./components/MeetingRoom.jsx";
import Login from "./components/login.jsx";
import Signup from "./components/signup.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/prejoin/:roomId" element={<PreJoin />} />
        <Route path="/room/:roomId" element={<MeetingRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
