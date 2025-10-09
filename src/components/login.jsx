import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Note: Removed the local asset import 'landingPageImage' as it cannot be guaranteed to load in this single-file environment.

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    // Placeholder: replace with real auth logic
    console.log(`Attempting login for ${username}`);
    // Since we don't have routing setup, we'll just log
    // In a real app, this would be navigate("/");
  };

  return (
    // 1. Change main background to #A3AFEF and default text color to black for contrast
    <div className="flex flex-row h-screen w-screen bg-[#A3AFEF] text-black font-sans">
      
      {/* Left (Login) Section - Smaller and shifted right */}
      <div className="w-[400px] h-[500px] flex flex-col items-center justify-center ml-48 mt-40">
        
        {/* App Title - Changed text color to black */}
        <h1 className="text-4xl font-bold mb-10 text-black self-start ml-2">Zynthora AI</h1>
        
        {/* Login Form Box - Changed background to #778AEB (dark blue) and adjusted inner colors for visibility */}
        <div className="bg-[#778AEB] backdrop-blur-sm p-10 rounded-2xl shadow-2xl shadow-black/40 w-full h-full flex flex-col justify-center space-y-6 border border-white/20">
          
          {/* Login Heading - Changed text color to black */}
          <h2 className="text-2xl font-semibold text-black text-center">Login</h2>
          
          <div className="w-full space-y-5">
            <div>
              {/* Label - Changed text color to black/80 */}
              <label className="block text-sm font-medium text-black/80 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                // Input - Adjusted text and placeholder to black for consistency
                className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              {/* Label - Changed text color to black/80 */}
              <label className="block text-sm font-medium text-black/80 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Input - Adjusted text and placeholder to black for consistency
                className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
                placeholder="Enter your password"
              />
            </div>
            
            {/* Link - Changed text color to black/70 and hover to black */}
            <a href="#" className="block text-sm text-black/70 hover:text-black transition-colors duration-200 text-center mt-1">
              Forgot Password?
            </a>
          </div>
          
          {/* Login Button - Changed text/border color to black and hover state */}
          <button
            onClick={handleLogin}
            className="w-[364px] h-[60px] mt-2 px-6 py-3 text-black rounded-lg border-2 border-black bg-transparent font-semibold text-lg hover:bg-black/10 transition-all duration-300 transform hover:scale-105 active:scale-95 self-center"
          >
            Login
          </button>
        </div>
      </div>
      
      {/* Right (Image) Section - Shifted right */}
      <div className="flex-1 flex items-center justify-center pr-40">
        <div className="w-[650px] h-[670px] flex items-center justify-center ml-8">
          <img
            // Using a placeholder image URL, consistent with previous requests
            src="https://placehold.co/650x670/CED5F9/1E1E1E?text=Secure+Login"
            alt="Video conference call"
            className="w-full h-full object-cover rounded-2xl shadow-2xl shadow-black/30"
          />
        </div>
      </div>
    </div>
  );
}

export default Login;