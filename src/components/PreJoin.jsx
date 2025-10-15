// src/components/PreJoin.jsx

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 🛑 IMPORTANT: Import the correct file and the new utility function
import { 
    BACKGROUND_OPTIONS, 
    getSelectedBackgroundProps, // <-- NEW FUNCTION used to get image style
    isVirtualBackgroundSelected 
} from './Background.jsx'; 


// Load Tailwind CSS from CDN for convenience.
const tailwindScript = document.createElement("script");
tailwindScript.src = "https://cdn.tailwindcss.com";
document.head.appendChild(tailwindScript);

const EUROPEAN_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "pl", name: "Polish" },
];


function PreJoin() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const userVideo = useRef(null);

  const [name, setName] = useState("");
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [localVolume, setLocalVolume] = useState(1);
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState("");
  const [isNoiseSuppressionOn, setIsNoiseSuppressionOn] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(
    EUROPEAN_LANGUAGES[0].code
  );
  const [selectedBackgroundEffect, setSelectedBackgroundEffect] = useState(
    BACKGROUND_OPTIONS[0].code
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [joinedUsers, setJoinedUsers] = useState([]);

  // ✅ Setup media stream ONCE on mount
  useEffect(() => {
    let currentStream;

    const setupMedia = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(
          (d) => d.kind === "audioinput"
        );
        const audioOutputDevices = devices.filter(
          (d) => d.kind === "audiooutput"
        );

        setAudioInputs(audioInputDevices);
        setAudioOutputs(audioOutputDevices);

        const initialMicId = audioInputDevices[0]?.deviceId || null;
        setSelectedAudioInput(initialMicId || "");

        if (audioOutputDevices.length > 0) {
          setSelectedAudioOutput(audioOutputDevices[0].deviceId);
        }

        // 🎥 Get camera + mic stream ONCE
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            deviceId: initialMicId ? { exact: initialMicId } : undefined,
            noiseSuppression: isNoiseSuppressionOn,
            echoCancellation: true,
          },
        });

        setStream(currentStream);
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setErrorMessage(
          "Please allow camera and microphone access to join the room."
        );
      }
    };

    setupMedia();

    // Cleanup on unmount
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isNoiseSuppressionOn]); 

  // 🎤 Toggle mic
  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  // 📸 Toggle camera
  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  };

  // 🔊 Handle mic change without recreating entire stream
  const handleAudioInputChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedAudioInput(deviceId);

    if (!stream) return;

    try {
      // Get a new stream just for the audio track
      const newAudio = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          noiseSuppression: isNoiseSuppressionOn,
          echoCancellation: true,
        },
      });

      const oldTrack = stream.getAudioTracks()[0];
      const newTrack = newAudio.getAudioTracks()[0];

      if (oldTrack) {
        stream.removeTrack(oldTrack);
        oldTrack.stop();
      }

      if (newTrack) {
        stream.addTrack(newTrack);
        // Ensure new track inherits current micOn state
        newTrack.enabled = micOn;
      }
    } catch (err) {
      console.error("Error switching microphone:", err);
    }
  };

  const handleAudioOutputChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedAudioOutput(deviceId);
    if (userVideo.current && typeof userVideo.current.setSinkId === "function") {
      try {
        await userVideo.current.setSinkId(deviceId);
      } catch (error) {
        console.error("Could not set audio output device:", error);
      }
    }
  };

  const handleVolumeChange = (e) => {
    setLocalVolume(parseFloat(e.target.value));
  };

  const toggleNoiseSuppression = async () => {
    // Optimistically toggle state
    setIsNoiseSuppressionOn((prev) => !prev);
    // The main useEffect handles stream recreation due to dependency change.
  };

  const joinRoom = () => {
    if (!name) {
      setErrorMessage("Please enter your name.");
      return;
    }
    setErrorMessage("");
    navigate(`/room/${roomId}`, {
      state: {
        name,
        cameraOn,
        micOn,
        selectedAudioInput,
        selectedAudioOutput,
        isNoiseSuppressionOn,
        selectedLanguage,
        selectedBackgroundEffect,
      },
    });
  };

    // ✅ Retrieve background properties (className and style)
    const { className: backgroundClass, style: backgroundStyle } = 
        getSelectedBackgroundProps(selectedBackgroundEffect);

    const showVideoFeed = cameraOn && !isVirtualBackgroundSelected(selectedBackgroundEffect);
    
    // 🎛️ NEW BLUR LOGIC
    const isLightBlur = selectedBackgroundEffect === "blur-light";
    const isHeavyBlur = selectedBackgroundEffect === "blur-heavy";
    const showBlurEffect = isLightBlur || isHeavyBlur;
    
    // Class for the blurred background layer
    const blurClass = isLightBlur ? 'filter blur-md' : isHeavyBlur ? 'filter blur-xl' : '';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1D2C2A] text-[#E8E7E5] font-sans">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-[#1E1F21]">
        <div className="font-bold">Meeting Code: {roomId}</div>
        <div className="font-bold">Meeting Title</div>
        <div className="font-bold">Host Name</div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 p-8 justify-center items-center md:space-x-8 space-y-8 md:space-y-0">
        {/* Left Sidebar */}
        <div className="flex flex-col items-start p-4 bg-[#2E4242] rounded-xl shadow-lg w-full md:w-1/4 min-w-[200px] space-y-4">
          <label className="block text-sm font-medium">Select your language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
          >
            {EUROPEAN_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <h3 className="text-xl font-semibold">Already in meet:</h3>
          <div className="w-full flex flex-col items-center justify-center p-4 bg-[#1E1F21] rounded-lg mb-4">
            <div className="text-center text-sm">
              You'll be the first to join!
            </div>
          </div>

          <label className="text-white font-medium">Enter Name</label>
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded-lg border border-[#6D8A78] bg-[#1E1F21] text-white mb-4"
          />

          <h3 className="text-xl font-semibold mt-4">Background</h3>
          <select
            value={selectedBackgroundEffect}
            onChange={(e) => setSelectedBackgroundEffect(e.target.value)}
            className="block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
          >
            {BACKGROUND_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Center Video */}
        <div className="flex-1 relative min-w-[400px] max-w-3xl rounded-xl overflow-hidden shadow-2xl">
          <div
            // 🛑 CRITICAL CHANGE: Use backgroundClass AND apply backgroundStyle
            className={`w-full h-full flex items-center justify-center relative ${backgroundClass}`}
            style={backgroundStyle} // <-- Applies the dynamic image URL
          >
            
            {/* 🛑 BLUR FIX: Duplicate the video element for the blurred background effect */}
            {showBlurEffect && stream && (
                <video
                    // This is the blurred background layer
                    autoPlay
                    muted
                    playsInline
                    // Set the source object to the main stream
                    srcObject={stream} 
                    // Apply the blur class to this duplicate element
                    className={`absolute inset-0 w-full h-full object-cover rounded-xl ${blurClass}`}
                    // Ensure it's rendered behind the main video feed
                    style={{ zIndex: 1 }} 
                />
            )}

            <video
                // This is the foreground layer (user's main video)
              ref={userVideo}
              autoPlay
              muted
              playsInline
                // The blur effect is REMOVED from this element
              className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 relative ${
                showVideoFeed ? 'opacity-100' : 'opacity-0'
              }`}
              // Ensure the foreground video is above the blurred background
              style={{ zIndex: 10 }}
            />
            
            {/* Display message when video is off, which also reveals the static background */}
            {!showVideoFeed && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-xl bg-black bg-opacity-50" style={{ zIndex: 11 }}>
                    {cameraOn ? 'Selected Virtual Background' : 'Camera is Off'}
                </div>
            )}
          </div>
          {errorMessage && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-red-600 bg-opacity-80 text-white rounded-lg shadow-lg">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col items-start p-4 bg-[#2E4242] rounded-xl shadow-lg w-full md:w-1/4 min-w-[200px] space-y-4">
          <label className="block text-sm font-medium">Select Microphone:</label>
          <select
            value={selectedAudioInput}
            onChange={handleAudioInputChange}
            className="block w-full rounded-md bg-gray-700 border-gray-600 text-white"
          >
            {audioInputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Mic ${device.deviceId.substring(0, 4)}`}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium">Select Speaker:</label>
          <select
            value={selectedAudioOutput}
            onChange={handleAudioOutputChange}
            className="block w-full rounded-md bg-gray-700 border-gray-600 text-white"
          >
            {audioOutputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Speaker ${device.deviceId.substring(0, 4)}`}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium">
            Microphone Volume: {Math.round(localVolume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localVolume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-600 rounded-lg cursor-pointer"
          />

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Noise Suppression</label>
            <button
              onClick={toggleNoiseSuppression}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isNoiseSuppressionOn ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isNoiseSuppressionOn ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <label className="block text-sm font-medium">Camera</label>
          <button
            onClick={toggleCamera}
            className={`w-1/2 p-2 rounded-lg ${
              cameraOn ? "bg-green-600 text-white" : "bg-gray-400 text-gray-800"
            }`}
          >
            {cameraOn ? "Camera On" : "Camera Off"}
          </button>

          <label className="block text-sm font-medium">Microphone</label>
          <button
            onClick={toggleMic}
            className={`w-1/2 p-2 rounded-lg ${
              micOn ? "bg-green-600 text-white" : "bg-gray-400 text-gray-800"
            }`}
          >
            {micOn ? "Mic On" : "Mic Off"}
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-center p-4 bg-[#1E1F21]">
        <div className="text-xl font-bold">Meeting Room</div>
        <div className="flex space-x-4">
          <button
            onClick={joinRoom}
            className="p-3 bg-[#6D8A78] text-white font-bold rounded-lg hover:bg-[#5a7164]"
          >
            Join Now
          </button>
            {/* ✅ FIXED: The missing closing tag for the 'Leave' button */}
          <button className="p-3 bg-transparent text-[#6D8A78] font-bold rounded-lg border border-[#6D8A78] hover:bg-[#6D8A78] hover:text-white">
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreJoin;