import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Load Tailwind CSS from CDN and Font Awesome for icons
const tailwindScript = document.createElement("script");
tailwindScript.src = "https://cdn.tailwindcss.com";
document.head.appendChild(tailwindScript);

const fontAwesomeScript = document.createElement("script");
fontAwesomeScript.src = "https://kit.fontawesome.com/a86f990772.js";
fontAwesomeScript.crossOrigin = "anonymous";
document.head.appendChild(fontAwesomeScript);

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { name, cameraOn, micOn } = location.state || {};
  const [stream, setStream] = useState(null);
  const userVideo = useRef();
  const [errorMessage, setErrorMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [pendingParticipants, setPendingParticipants] = useState([]);

  // Mock data for new join requests
  const mockJoinRequests = [
    { id: 101, name: "Jessica", videoUrl: "https://placehold.co/600x400/98E7A0/ffffff?text=Jessica" },
    { id: 102, name: "Michael", videoUrl: "https://placehold.co/600x400/81B4AE/ffffff?text=Michael" },
  ];

  useEffect(() => {
    // If we don't have the user's name, redirect them back to the pre-join screen.
    if (!name) {
      navigate(`/prejoin/${roomId}`);
      return;
    }

    // Add the current user as the first participant
    setParticipants([{ id: 'me', name: name, stream: null }]);

    let currentStream = null;
    navigator.mediaDevices.getUserMedia({ video: cameraOn, audio: micOn })
      .then((mediaStream) => {
        currentStream = mediaStream;
        setStream(mediaStream);
        if (userVideo.current) {
          userVideo.current.srcObject = mediaStream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices in room.", error);
        setErrorMessage("Could not access your camera or microphone. Please ensure permissions are granted and try again.");
      });

    // Simulate new users trying to join after a delay
    const joinRequestTimer = setTimeout(() => {
      setPendingParticipants(mockJoinRequests);
    }, 5000); // 5-second delay

    // Cleanup function to stop the stream and timers when the component unmounts
    return () => {
      clearTimeout(joinRequestTimer);
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [name, cameraOn, micOn, roomId, navigate]);

  const handleAdmit = (userToAdmit) => {
    setParticipants(prev => [...prev, userToAdmit]);
    setPendingParticipants(prev => prev.filter(user => user.id !== userToAdmit.id));
  };

  const handleDeny = (userToDeny) => {
    setPendingParticipants(prev => prev.filter(user => user.id !== userToDeny.id));
  };

  const videoGridClass = participants.length > 1
    ? "flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-center items-center"
    : "flex-1 p-4 flex justify-center items-center";

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1D2C2A] text-[#E8E7E5] font-sans">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-[#1E1F21] flex-shrink-0">
        <div className="flex items-center space-x-2 p-2 bg-[#1E1F21] text-white font-bold">
          <span>Meeting Code: {roomId}</span>
          <i className="fas fa-share-alt"></i>
        </div>
        <div className="p-2 bg-[#1E1F21] text-white font-bold">
          Meeting Title
        </div>
        <div className="p-2 bg-[#1E1F21] text-white font-bold">
          Host Name
        </div>
      </div>

      {/* Main Content Area - Video Grid and Controls */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar for Controls */}
        <div className="flex flex-col w-[60px] p-2 bg-[#1E1F21] items-center justify-between">
          <div className="flex flex-col items-center space-y-4">
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <i className="far fa-smile-wink"></i>
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <i className="fas fa-upload"></i>
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <i className="fas fa-hand-paper"></i>
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <i className="fas fa-video"></i>
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <i className="fas fa-microphone"></i>
            </button>
          </div>
          <button
            onClick={() => {
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              navigate(`/prejoin/${roomId}`);
            }}
            className="w-full p-2 bg-red-600 text-white font-bold rounded-lg transition-colors duration-200 hover:bg-red-700"
          >
            Leave
          </button>
          <div className="flex flex-col items-center space-y-4">
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <i className="fas fa-user-friends"></i>
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <i className="fas fa-cog"></i>
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className={videoGridClass}>
          {/* User's own video */}
          {participants.find(p => p.id === 'me') && (
            <div className={`relative w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden shadow-2xl aspect-video bg-[#1E1F21] ${participants.length === 1 ? 'w-full h-full' : ''}`}>
              <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover rounded-xl" />
              <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-lg">
                {name}
              </div>
              {errorMessage && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-red-600 bg-opacity-80 text-white rounded-lg shadow-lg text-center">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {/* Other admitted participants' videos */}
          {participants.filter(p => p.id !== 'me').map(user => (
            <div key={user.id} className="relative w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden shadow-2xl aspect-video bg-[#1E1F21]">
              <img src={user.videoUrl} alt={`${user.name}'s video`} className="w-full h-full object-cover rounded-xl" />
              <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-lg">
                {user.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admission Dialog */}
      {pendingParticipants.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#2E4242] p-8 rounded-xl shadow-2xl text-white max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">People waiting to join</h2>
            {pendingParticipants.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-[#1E1F21] rounded-lg mb-2">
                <div className="flex items-center space-x-4">
                  <img src={user.videoUrl} alt={`${user.name}'s avatar`} className="w-12 h-12 rounded-full object-cover" />
                  <span className="text-lg">{user.name} wants to join.</span>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleAdmit(user)}
                    className="px-4 py-2 bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Admit
                  </button>
                  <button
                    onClick={() => handleDeny(user)}
                    className="px-4 py-2 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Room;