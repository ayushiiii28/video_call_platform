import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Load Tailwind CSS from CDN for convenience.
const tailwindScript = document.createElement("script");
tailwindScript.src = "https://cdn.tailwindcss.com";
document.head.appendChild(tailwindScript);

function PreJoin() {
  const { roomId } = useParams();
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
  const [errorMessage, setErrorMessage] = useState("");
  const userVideo = useRef();
  const navigate = useNavigate();
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Function to get the media stream with specific constraints
  const getStream = useCallback(async (micId) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          deviceId: micId ? { exact: micId } : undefined,
          noiseSuppression: isNoiseSuppressionOn,
          echoCancellation: true,
        },
      });

      setStream(newStream);
      if (userVideo.current) {
        userVideo.current.srcObject = newStream;
      }

      // Disconnect and connect new audio nodes
      if (audioContextRef.current) {
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect();
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect();
        }
      }

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(newStream);
      gainNodeRef.current = audioContextRef.current.createGain();

      sourceNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = localVolume;

      const audioTrack = newStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = micOn;
      }
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = cameraOn;
      }
    } catch (error) {
      console.error("Error accessing media devices.", error);
      setErrorMessage("Please allow camera and microphone access to join the room.");
    }
  }, [cameraOn, micOn, localVolume, isNoiseSuppressionOn]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter((device) => device.kind === "audioinput");
        const audioOutputDevices = devices.filter((device) => device.kind === "audiooutput");

        setAudioInputs(audioInputDevices);
        setAudioOutputs(audioOutputDevices);

        if (audioInputDevices.length > 0) {
          setSelectedAudioInput(audioInputDevices[0].deviceId);
          getStream(audioInputDevices[0].deviceId);
        } else {
          getStream(null);
        }
        if (audioOutputDevices.length > 0) {
          setSelectedAudioOutput(audioOutputDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };
    getDevices();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [getStream]);

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const handleAudioInputChange = (e) => {
    const deviceId = e.target.value;
    setSelectedAudioInput(deviceId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    getStream(deviceId);
  };

  const handleAudioOutputChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedAudioOutput(deviceId);
    if (userVideo.current && typeof userVideo.current.setSinkId === 'function') {
      try {
        await userVideo.current.setSinkId(deviceId);
      } catch (error) {
        console.error("Could not set audio output device: ", error);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
  };
  
  const toggleNoiseSuppression = () => {
    setIsNoiseSuppressionOn(prev => !prev);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    getStream(selectedAudioInput);
  };

  const joinRoom = () => {
    if (!name) {
      setErrorMessage("Please enter your name.");
      return;
    }
    setErrorMessage("");
    navigate(`/room/${roomId}`, { state: { name, cameraOn, micOn, selectedAudioInput, selectedAudioOutput, isNoiseSuppressionOn } });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1D2C2A] text-[#E8E7E5] font-sans">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-[#1E1F21]">
        <div className="p-2 bg-[#1E1F21] text-white font-bold">
          Meeting Code: {roomId}
        </div>
        <div className="p-2 bg-[#1E1F21] text-white font-bold">
          Meeting Title
        </div>
        <div className="p-2 bg-[#1E1F21] text-white font-bold">
          Host Name
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row flex-1 p-8 justify-center items-center md:space-x-8 space-y-8 md:space-y-0">
        {/* Left Sidebar */}
        <div className="flex flex-col items-start p-4 bg-[#2E4242] rounded-xl shadow-lg w-full md:w-1/4 min-w-[200px] space-y-4">
          <h3 className="text-xl font-semibold">Already in meet:</h3>
          <div className="w-full h-20 bg-[#1E1F21] rounded-lg mb-4" />
          <label className="text-white font-medium">Enter Name</label>
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded-lg border border-[#6D8A78] bg-[#1E1F21] text-white mb-4"
          />
          <label className="flex items-center text-white">
            <input type="checkbox" className="mr-2" />
            Remember your name
          </label>
          <h3 className="text-xl font-semibold mt-4">Background</h3>
          <div className="w-full h-20 border border-[#6D8A78] bg-[#1E1F21] rounded-lg" />
        </div>

        {/* Central Video Section */}
        <div className="flex-1 flex flex-col items-center relative min-w-[400px] max-w-3xl rounded-xl overflow-hidden shadow-2xl">
          <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover rounded-xl" />
          {errorMessage && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-red-600 bg-opacity-80 text-white rounded-lg shadow-lg">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col items-start p-4 bg-[#2E4242] rounded-xl shadow-lg w-full md:w-1/4 min-w-[200px] space-y-4">
          {/* Audio Input Selection */}
          <label className="block text-sm font-medium">Select Microphone:</label>
          <select
            value={selectedAudioInput}
            onChange={handleAudioInputChange}
            className="mt-1 block w-full rounded-md shadow-sm bg-gray-700 border-gray-600 focus:border-[#6D8A78] focus:ring focus:ring-[#6D8A78] focus:ring-opacity-50 text-white"
          >
            {audioInputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.substring(0, 4)}`}
              </option>
            ))}
          </select>

          {/* Audio Output Selection */}
          <label className="block text-sm font-medium">Select Speaker:</label>
          <select
            value={selectedAudioOutput}
            onChange={handleAudioOutputChange}
            className="mt-1 block w-full rounded-md shadow-sm bg-gray-700 border-gray-600 focus:border-[#6D8A78] focus:ring focus:ring-[#6D8A78] focus:ring-opacity-50 text-white"
          >
            {audioOutputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Speaker ${device.deviceId.substring(0, 4)}`}
              </option>
            ))}
          </select>

          {/* Volume Control */}
          <div>
            <label className="block text-sm font-medium">Microphone Volume: {Math.round(localVolume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localVolume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>
          
          {/* Noise Suppression Toggle */}
          <div className="flex items-center space-x-2">
            <label htmlFor="noise-suppression" className="text-sm font-medium">Noise Suppression</label>
            <button
              onClick={toggleNoiseSuppression}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isNoiseSuppressionOn ? 'bg-green-600' : 'bg-gray-400'}`}
              role="switch"
              aria-checked={isNoiseSuppressionOn}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isNoiseSuppressionOn ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Camera Toggle */}
          <label className="block text-sm font-medium">Camera</label>
          <button
            onClick={toggleCamera}
            className={`w-1/2 p-2 rounded-lg transition-colors duration-200 ${
              cameraOn ? 'bg-green-600 text-white' : 'bg-gray-400 text-gray-800'
            }`}
          >
            {cameraOn ? 'Camera On' : 'Camera Off'}
          </button>
          
          {/* Microphone Toggle */}
          <label className="block text-sm font-medium">Microphone</label>
          <button
            onClick={toggleMic}
            className={`w-1/2 p-2 rounded-lg transition-colors duration-200 ${
              micOn ? 'bg-green-600 text-white' : 'bg-gray-400 text-gray-800'
            }`}
          >
            {micOn ? 'Mic On' : 'Mic Off'}
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-center p-4 bg-[#1E1F21]">
        <div className="text-xl font-bold">Meeting Room</div>
        <div className="flex space-x-4">
          <button
            onClick={joinRoom}
            className="p-3 bg-[#6D8A78] text-white font-bold rounded-lg transition-colors duration-200 hover:bg-[#5a7164]"
          >
            Join Now
          </button>
          <button
            onClick={() => { /* Leave functionality */ }}
            className="p-3 bg-transparent text-[#6D8A78] font-bold rounded-lg border border-[#6D8A78] transition-colors duration-200 hover:bg-[#6D8A78] hover:text-white"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreJoin;