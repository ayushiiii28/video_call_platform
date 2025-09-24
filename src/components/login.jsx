import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import landingPageImage from "./landing_page_image.png";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    // Placeholder: replace with real auth
    // Using console.log instead of alert() for a better UI experience.
    console.log(`Logged in as ${username}`);
    navigate("/"); // Redirect after login
  };

  return (
    <div className="flex flex-row h-screen w-screen bg-[#1D2C2A] text-white font-sans">
      {/* Left (Login) Section */}
      <div className="w-1/2 flex flex-col items-center justify-center p-10">
        <div className="bg-[#2E4242] p-10 rounded-xl shadow-lg w-3/4 max-w-lg flex flex-col items-center space-y-6">
          <h2 className="text-white text-4xl font-semibold mb-4">Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6D8A78] text-lg bg-gray-800 text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6D8A78] text-lg bg-gray-800 text-white"
          />
          <a href="#" className="text-sm text-white self-start ml-2 hover:underline">
            Forgot Password?
          </a>
          <button
            onClick={handleLogin}
            className="w-1/2 mt-4 px-6 py-3 text-white rounded-lg border-2 border-[#E8E7E5] bg-transparent font-bold text-lg hover:bg-gray-800 transition-colors duration-300"
          >
            Login
          </button>
        </div>
      </div>
      
      {/* Right (Image) Section */}
      <div className="w-1/2 flex items-center justify-center p-10">
        <img
          src={landingPageImage}
          alt="Video conference call"
          className="w-full h-full object-cover rounded-xl shadow-lg"
        />
      </div>
    </div>
  );
}

export default Login;