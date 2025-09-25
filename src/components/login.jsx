import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import landingPageImage from "./landing_page_image.png";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    // Placeholder: replace with real auth
    console.log(`Logged in as ${username}`);
    navigate("/"); // Redirect after login
  };

  return (
    <div className="flex flex-row h-screen w-screen bg-gradient-to-br from-[#1D2C2A] to-[#2E4242] text-white font-sans">
      {/* Left (Login) Section - Smaller and shifted right */}
      <div className="w-[400px] h-[500px] flex flex-col items-center justify-center ml-48 mt-40">
        {/* App Title */}
        <h1 className="text-4xl font-bold mb-10 text-white self-start ml-2">Zynthora AI</h1>
        
        <div className="bg-[#2E4242]/70 backdrop-blur-sm p-10 rounded-2xl shadow-2xl w-full h-full flex flex-col justify-center space-y-6 border border-white/10">
          <h2 className="text-2xl font-semibold text-white text-center">Login</h2>
          
          <div className="w-full space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-white placeholder-white/50 transition-colors duration-200"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-white placeholder-white/50 transition-colors duration-200"
                placeholder="Enter your password"
              />
            </div>
            
            <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors duration-200 text-center mt-1">
              Forgot Password?
            </a>
          </div>
          
          {/* Login Button - 364x60 */}
          <button
            onClick={handleLogin}
            className="w-[364px] h-[60px] mt-2 px-6 py-3 text-white rounded-lg border-2 border-white bg-transparent font-semibold text-lg hover:bg-white/10 transition-all duration-300 transform hover:scale-105 active:scale-95 self-center"
          >
            Login
          </button>
        </div>
      </div>
      
      {/* Right (Image) Section - Shifted right */}
      <div className="flex-1 flex items-center justify-center pr-40">
        <div className="w-[650px] h-[670px] flex items-center justify-center ml-8">
          <img
            src={landingPageImage}
            alt="Video conference call"
            className="w-full h-full object-cover rounded-2xl shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}

export default Login;