import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Note: Removed the local asset import 'landingPageImage' as it cannot be guaranteed to load in this single-file environment.

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = () => {
    // Placeholder: replace with real auth
    // Using console.log instead of alert() for a better UI experience.
    console.log(`Attempting signup for ${name}`);
    // In a real app, this would be navigate("/login");
  };

  return (
    // 1. Change main background to #A3AFEF and default text color to black for contrast
    <div className="flex flex-row h-screen w-screen bg-[#A3AFEF] text-black font-sans">
      
      {/* Left (Signup) Section - Adjusted size and positioning to match Login page */}
      <div className="w-[400px] h-[500px] flex flex-col items-center justify-center ml-48 mt-40">

        {/* App Title - Added with styles from Login.jsx */}
        <h2 style={{ color: "black", marginBottom: "1rem", fontSize: "2rem" }} className="font-bold self-start ml-2">Zynthora AI</h2>
        
        {/* Signup Form Box - Changed background to #778AEB and adjusted inner colors */}
        <div className="bg-[#778AEB] backdrop-blur-sm p-10 rounded-2xl shadow-2xl shadow-black/40 w-full h-full flex flex-col justify-center space-y-6 border border-white/20">
          
          {/* Heading - Changed text color to black for consistency (low contrast) */}
          <h2 className="text-black text-3xl font-semibold text-center mb-4">Create Account</h2>
          
          <div className="w-full space-y-5">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              // Input style updated for consistency with Login: transparent background, black text/placeholder
              className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Input style updated for consistency with Login: transparent background, black text/placeholder
              className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Input style updated for consistency with Login: transparent background, black text/placeholder
              className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
            />
          </div>
          
          {/* Button - Changed text/border color to black for consistency (low contrast) */}
          <button
            onClick={handleSignup}
            className="w-[364px] h-[60px] mt-2 px-6 py-3 text-black rounded-lg border-2 border-black bg-transparent font-semibold text-lg hover:bg-black/10 transition-all duration-300 transform hover:scale-105 active:scale-95 self-center"
          >
            Create Account
          </button>
        </div>
      </div>
      
      {/* Right (Image) Section - Adjusted size and positioning to match Login page */}
      <div className="flex-1 flex items-center justify-center pr-40">
        <div className="w-[650px] h-[670px] flex items-center justify-center ml-8">
          <img
            // Using a placeholder image URL for a consistent look
            src="https://placehold.co/650x670/CED5F9/1E1E1E?text=New+User+Setup"
            alt="User signup interface"
            className="w-full h-full object-cover rounded-2xl shadow-2xl shadow-black/30"
          />
        </div>
      </div>
    </div>
  );
}

export default Signup;