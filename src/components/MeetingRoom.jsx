import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChatBox from "./ChatBox";
import ScreenShare from "./ScreenShare";
import Recording from "./Recording";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSmileWink, faUpload, faHandPaper, faVideo, faMicrophone, 
  faCommentDots, faDesktop, faUserFriends, faCog, faEllipsisV, faShareAlt 
} from '@fortawesome/free-solid-svg-icons';

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { name, cameraOn, micOn } = location.state || {};
  const [stream, setStream] = useState(null);
  const userVideo = useRef();
  const [participants, setParticipants] = useState([]);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const mockJoinRequests = [
    { id: 101, name: "Jessica", videoUrl: "https://placehold.co/600x400/98E7A0/ffffff?text=Jessica" },
    { id: 102, name: "Michael", videoUrl: "https://placehold.co/600x400/81B4AE/ffffff?text=Michael" },
  ];

  // Get user media
  useEffect(() => {
    if (!name) {
      navigate(`/prejoin/${roomId}`);
      return;
    }

    setParticipants([{ id: 'me', name: name, stream: null }]);

    let currentStream = null;

    navigator.mediaDevices.getUserMedia({ video: cameraOn, audio: micOn })
      .then((mediaStream) => {
        currentStream = mediaStream;
        setStream(mediaStream);
        if (userVideo.current) userVideo.current.srcObject = mediaStream;
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    const joinRequestTimer = setTimeout(() => {
      setPendingParticipants(mockJoinRequests);
    }, 5000);

    return () => {
      clearTimeout(joinRequestTimer);
      if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    };
  }, [name, cameraOn, micOn, roomId, navigate]);

  const handleAdmit = (userToAdmit) => {
    setParticipants(prev => [...prev, userToAdmit]);
    setPendingParticipants(prev => prev.filter(user => user.id !== userToAdmit.id));
  };

  const handleDeny = (userToDeny) => {
    setPendingParticipants(prev => prev.filter(user => user.id !== userToDeny.id));
  };

  const toggleChat = () => setIsChatOpen(prev => !prev);
  const toggleScreenShare = () => setIsScreenSharing(prev => !prev);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1D2C2A] text-[#E8E7E5] font-sans">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-[#1E1F21] flex-shrink-0">
        <div className="flex items-center space-x-2 p-2 bg-[#1E1F21] text-white font-bold">
          <span>Meeting Code: {roomId}</span>
          <FontAwesomeIcon icon={faShareAlt} />
        </div>
        <div className="p-2 bg-[#1E1F21] text-white font-bold">Meeting Title</div>
        <div className="p-2 bg-[#1E1F21] text-white font-bold">Host Name</div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="flex flex-col w-[60px] p-2 bg-[#1E1F21] items-center justify-between flex-shrink-0 h-full">
          <div className="flex flex-col items-center space-y-4 mt-4">
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <FontAwesomeIcon icon={faSmileWink} />
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <FontAwesomeIcon icon={faUpload} />
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <FontAwesomeIcon icon={faHandPaper} />
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <FontAwesomeIcon icon={faVideo} />
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <FontAwesomeIcon icon={faMicrophone} />
            </button>

            {/* ScreenShare */}
            <button
              onClick={toggleScreenShare}
              className={`text-2xl transition-colors duration-200 ${isScreenSharing ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              title="Screen Share"
            >
              <FontAwesomeIcon icon={faDesktop} />
            </button>

            {/* Chat */}
            <button
              onClick={toggleChat}
              className={`text-2xl transition-colors duration-200 ${isChatOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              title="Chat"
            >
              <FontAwesomeIcon icon={faCommentDots} />
            </button>

            {/* Recording */}
            <Recording stream={stream} />
          </div>

          {/* Leave Button */}
          <button
            onClick={() => {
              if (stream) stream.getTracks().forEach(track => track.stop());
              navigate(`/prejoin/${roomId}`);
            }}
            className="w-full p-2 bg-red-600 text-white font-bold rounded-lg transition-colors duration-200 hover:bg-red-700"
          >
            Leave
          </button>

          <div className="flex flex-col items-center space-y-4 mb-4">
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <FontAwesomeIcon icon={faUserFriends} />
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <FontAwesomeIcon icon={faCog} />
            </button>
            <button className="text-gray-400 text-2xl hover:text-white transition-colors duration-200">
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-80' : 'mr-0'} p-4 flex flex-wrap justify-center gap-4`}>
          {participants.map(user => (
            <div key={user.id} className="relative w-full md:w-80 h-60 rounded-xl overflow-hidden shadow-2xl bg-[#1E1F21]">
              {user.id === 'me' ? (
                <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={user.videoUrl} alt={user.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-sm">{user.name}</div>
            </div>
          ))}
        </div>

        {/* ChatBox Sidebar */}
        {isChatOpen && (
          <div className="absolute top-0 right-0 h-full w-80 z-40 transition-transform duration-300">
            <ChatBox />
          </div>
        )}
      </div>

      {/* ScreenShare Overlay */}
      {isScreenSharing && <ScreenShare stream={stream} />}

      {/* Admission Dialog */}
      {pendingParticipants.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#2E4242] p-8 rounded-xl shadow-2xl text-white max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">People waiting to join</h2>
            {pendingParticipants.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-[#1E1F21] rounded-lg mb-2">
                <div className="flex items-center space-x-4">
                  <img src={user.videoUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                  <span className="text-lg">{user.name} wants to join.</span>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleAdmit(user)} className="px-4 py-2 bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors">Admit</button>
                  <button onClick={() => handleDeny(user)} className="px-4 py-2 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors">Deny</button>
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
