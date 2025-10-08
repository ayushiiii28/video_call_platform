import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChatBox from "./ChatBox";
import ScreenShare from "./ScreenShare";
import Recording from "./Recording";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSmileWink, faHandPaper, 
  faVideo, faVideoSlash, 
  faMicrophone, faMicrophoneSlash, 
  faCommentDots, faDesktop, faUserFriends, faCog, faShareAlt, faTimes
} from '@fortawesome/free-solid-svg-icons';

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { name, cameraOn, micOn, selectedAudioInput, selectedAudioOutput, isNoiseSuppressionOn } = location.state || {};

  const [stream, setStream] = useState(null);
  const userVideo = useRef();
  const [participants, setParticipants] = useState([]);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false); 

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [reactionNotification, setReactionNotification] = useState(null);
  
  const [camera, setCamera] = useState(cameraOn ?? true);
  const [mic, setMic] = useState(micOn ?? true);
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedMic, setSelectedMic] = useState(selectedAudioInput ?? "");
  const [selectedSpeaker, setSelectedSpeaker] = useState(selectedAudioOutput ?? "");
  const [localVolume, setLocalVolume] = useState(1);
  const [noiseSuppression, setNoiseSuppression] = useState(isNoiseSuppressionOn ?? true);

  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  const mockJoinRequests = [
    { id: 101, name: "Jessica", videoUrl: "https://placehold.co/600x400/98E7A0/ffffff?text=Jessica" },
    { id: 102, name: "Michael", videoUrl: "https://placehold.co/600x400/81B4AE/ffffff?text=Michael" },
    { id: 103, name: "Charlie", videoUrl: "https://placehold.co/600x400/FFD700/000000?text=Charlie" },
  ];

  // Get user media and devices (FIXED LOGIC)
  useEffect(() => {
    if (!name) {
      navigate(`/prejoin/${roomId}`);
      return;
    }

    setParticipants([{ id: 'me', name: name, stream: null }]);

    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioIn = devices.filter(d => d.kind === "audioinput");
        const audioOut = devices.filter(d => d.kind === "audiooutput");
        setAudioInputs(audioIn);
        setAudioOutputs(audioOut);
        if (audioIn.length > 0 && !selectedMic) setSelectedMic(audioIn[0].deviceId);
        if (audioOut.length > 0 && !selectedSpeaker) setSelectedSpeaker(audioOut[0].deviceId);
      } catch (err) {
        console.error(err);
      }
    };

    const getStream = async (micId) => {
      // Always stop the old stream before getting a new one (only runs if dependencies change)
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
      
      try {
        // FIX: Always request both video and audio tracks if available. 
        // We will enable/disable them later based on state.
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true, // Request video 
          audio: {
            deviceId: micId ? { exact: micId } : undefined,
            noiseSuppression,
            echoCancellation: true,
          },
        });
        setStream(newStream);
        if (userVideo.current) userVideo.current.srcObject = newStream;

        // Setup gain node for volume
        if (audioContextRef.current) {
          sourceNodeRef.current.disconnect();
          gainNodeRef.current.disconnect();
        }
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(newStream);
        gainNodeRef.current = audioContextRef.current.createGain();
        sourceNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = localVolume;

        // FIX: Now that we requested the tracks, set their initial enabled state
        const audioTrack = newStream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = mic; // Respect the mic state
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = camera; // Respect the camera state

      } catch (error) {
        console.error("Error accessing media devices.", error);
        // If getting the stream fails, set both states to false to show the user the problem
        setCamera(false);
        setMic(false);
      }
    };

    getDevices();
    getStream(selectedMic);
    
    const joinRequestTimer = setTimeout(() => {
        setPendingParticipants(mockJoinRequests);
        setParticipants(prev => [...prev, mockJoinRequests[0]]);
    }, 5000);

    return () => {
      clearTimeout(joinRequestTimer);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  // FIX: Dependencies now only include things that *require* a new stream: name, device IDs, volume, and noise suppression. 
  // 'mic' and 'camera' are handled internally by the tracks and are NOT in the dependency array.
  }, [name, selectedMic, localVolume, noiseSuppression, navigate, roomId]); 

  // Toggles 
  const toggleChat = () => setIsChatOpen(prev => !prev);
  const toggleScreenShare = () => setIsScreenSharing(prev => !prev);
  const toggleSettings = () => setIsSettingsOpen(prev => !prev);
  const toggleParticipants = () => setIsParticipantsOpen(prev => !prev);
  const toggleEmojiPicker = () => setIsEmojiPickerOpen(prev => !prev);


  // Reaction & Hand Raise Functions (UNCHANGED)
  const sendReaction = (reaction) => {
    console.log(`Sending reaction: ${reaction}`);
    setIsEmojiPickerOpen(false); 
    setReactionNotification(reaction); 
    
    setTimeout(() => {
        setReactionNotification(null);
    }, 3000);
  };

  const toggleHandRaise = () => {
    setIsHandRaised(prev => !prev);
    console.log(`Hand is now ${!isHandRaised ? 'raised' : 'lowered'}`);
  };

  // Camera Toggle (FIXED - relies on tracks created in useEffect)
  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !camera;
        setCamera(prev => !prev);
        return; // Exit if track was successfully toggled
      }
    }
    // Fallback: update state even if stream is not ready/available
    setCamera(prev => !prev);
  };

  // Mic Toggle (FIXED - relies on tracks created in useEffect)
  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !mic;
        setMic(prev => !prev);
        return; // Exit if track was successfully toggled
      }
    }
    // Fallback: update state even if stream is not ready/available
    setMic(prev => !prev);
  };
  
  // Audio handlers (unchanged)
  const handleAudioInputChange = (e) => {
    setSelectedMic(e.target.value);
    // Note: Changing selectedMic triggers a full stream reload via useEffect dependency
  };

  const handleAudioOutputChange = async (e) => {
    setSelectedSpeaker(e.target.value);
    if (userVideo.current && typeof userVideo.current.setSinkId === 'function') {
      try { await userVideo.current.setSinkId(e.target.value); } 
      catch (err) { console.error(err); }
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setLocalVolume(v);
    if (gainNodeRef.current) gainNodeRef.current.gain.value = v;
  };

  const toggleNoiseSuppression = () => setNoiseSuppression(prev => !prev);

  const handleAdmit = (userToAdmit) => {
    setParticipants(prev => [...prev, userToAdmit]);
    setPendingParticipants(prev => prev.filter(u => u.id !== userToAdmit.id));
  };
  const handleDeny = (userToDeny) => setPendingParticipants(prev => prev.filter(u => u.id !== userToDeny.id));

  // Grid classes (UNCHANGED)
  const getGridContainerClass = (count) => {
    if (count === 1) {
        return "flex items-center justify-center";
    } else if (count <= 2) {
        return "grid grid-cols-2 grid-rows-1";
    } else if (count <= 4) {
        return "grid grid-cols-2 grid-rows-2";
    } else if (count <= 6) {
        return "grid grid-cols-3 grid-rows-2";
    } else if (count <= 9) {
        return "grid grid-cols-3 grid-rows-3";
    } else {
        return "grid grid-cols-4 grid-rows-4";
    }
  };

  const getGridItemClass = (count) => {
      const baseClasses = "relative bg-[#1E1F21] rounded-xl overflow-hidden shadow-2xl w-full h-full";
      if (count === 1) {
          return `${baseClasses}`;
      } 
      return `${baseClasses} aspect-video`; 
  };

  const containerClass = getGridContainerClass(participants.length);
  const itemClass = getGridItemClass(participants.length);

  // Component for the Emoji Picker Overlay (UNCHANGED)
  const EmojiPicker = () => (
    <div className="absolute left-[60px] top-4 z-50 p-3 bg-[#2E4242] rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white text-sm font-semibold">Reactions</h3>
        <button onClick={toggleEmojiPicker} className="text-gray-400 hover:text-white">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="flex space-x-2">
        {['👍', '❤️', '😂', '👏'].map(emoji => (
          <button 
            key={emoji}
            onClick={() => sendReaction(emoji)} 
            className="text-3xl p-1 hover:bg-gray-700 rounded-lg transition-colors"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1D2C2A] text-[#E8E7E5] font-sans">
      
      {/* Reaction Notification (UNCHANGED) */}
      {reactionNotification && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-3 rounded-lg shadow-xl animate-bounce">
              {reactionNotification} Reaction Sent!
          </div>
      )}
      
      {/* Top Bar (unchanged) */}
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
        <div className="flex flex-col w-[50px] p-1 bg-[#1E1F21] items-center justify-between flex-shrink-0 h-full">
          {/* Top Icons */}
          <div className="flex flex-col items-center space-y-4 mt-2">
            
            {/* Reaction Icon */}
            <button 
              onClick={toggleEmojiPicker} 
              className={`text-2xl transition-colors duration-200 ${isEmojiPickerOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`} 
              title="Send Reaction"
            >
              <FontAwesomeIcon icon={faSmileWink} />
            </button>
            
            {/* Hand Raise Icon */}
            <button 
              onClick={toggleHandRaise} 
              className={`text-2xl transition-colors duration-200 ${isHandRaised ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`} 
              title={isHandRaised ? "Lower Hand" : "Raise Hand"}
            >
              <FontAwesomeIcon icon={faHandPaper} />
            </button>
            
            {/* Camera Toggle */}
            <button 
              onClick={toggleCamera} 
              className={`text-2xl transition-colors duration-200 ${camera ? 'text-white' : 'text-red-500'} hover:text-white`} 
              title={camera ? "Turn Camera Off" : "Turn Camera On"}
            >
              <FontAwesomeIcon icon={camera ? faVideo : faVideoSlash} />
            </button>
            
            {/* Mic Toggle */}
            <button 
              onClick={toggleMic} 
              className={`text-2xl transition-colors duration-200 ${mic ? 'text-white' : 'text-red-500'} hover:text-white`} 
              title={mic ? "Turn Mic Off" : "Turn Mic On"}
            >
              <FontAwesomeIcon icon={mic ? faMicrophone : faMicrophoneSlash} />
            </button>
            
            {/* Screen Share Toggle */}
            <button onClick={toggleScreenShare} className={`text-2xl transition-colors duration-200 ${isScreenSharing ? 'text-white' : 'text-gray-400 hover:text-white'}`} title="Screen Share">
              <FontAwesomeIcon icon={faDesktop} />
            </button>
            
            {/* Chat Toggle */}
            <button onClick={toggleChat} className={`text-2xl transition-colors duration-200 ${isChatOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`} title="Chat">
              <FontAwesomeIcon icon={faCommentDots} />
            </button>
            <Recording stream={stream} />
          </div>

          <button onClick={() => { if(stream) stream.getTracks().forEach(t => t.stop()); navigate(`/prejoin/${roomId}`); }} className="w-full p-1 text-xs bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Leave</button>

          {/* Bottom Icons */}
          <div className="flex flex-col items-center space-y-4 mb-2">
            <button onClick={toggleSettings} className="text-2xl text-gray-400 hover:text-white transition-colors duration-200" title="Settings">
              <FontAwesomeIcon icon={faCog} />
            </button>
            <button onClick={toggleParticipants} className="text-2xl text-gray-400 hover:text-white transition-colors duration-200" title="Participants">
              <FontAwesomeIcon icon={faUserFriends} />
            </button>
          </div>
        </div>

        {/* EMOJI PICKER RENDERING */}
        {isEmojiPickerOpen && <EmojiPicker />}

        {/* Video Grid */}
        <div 
          className={`flex-1 transition-all duration-300 ${isChatOpen || isParticipantsOpen ? 'mr-80' : 'mr-0'} p-2 h-full w-full gap-2 ${containerClass}`}
        >
          {participants.map(user => (
            <div 
              key={user.id} 
              className={itemClass}
            >
              {user.id === 'me' ? (
                // Video element with object-contain
                <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-contain" />
              ) : (
                <img src={user.videoUrl} alt={user.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-sm">{user.name}</div>
            </div>
          ))}
        </div>

        {/* Chat Sidebar (unchanged) */}
        {isChatOpen && <div className="absolute top-0 right-0 h-full w-80 z-40 transition-transform duration-300"><ChatBox /></div>}

        {/* Participants Panel (unchanged) */}
        {isParticipantsOpen && (
          <div className="absolute top-0 right-0 h-full w-80 z-50 bg-[#1E1F21] p-4 overflow-y-auto shadow-xl transition-transform duration-300">
            <h2 className="text-white font-bold mb-4">Participants</h2>
            {participants.map(p => (
              <div key={p.id} className="flex items-center space-x-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
                  {p.name[0]}
                </div>
                <span className="text-white">{p.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Settings Panel (unchanged) */}
        {isSettingsOpen && (
          <div className="absolute top-16 left-[50px] w-80 h-auto p-4 bg-[#2E4242] rounded-xl shadow-xl space-y-4 z-50 transition-transform duration-300">
            <label className="text-white font-medium">Microphone</label>
            <select value={selectedMic} onChange={handleAudioInputChange} className="w-full p-2 rounded-lg bg-[#1E1F21] text-white">
              {audioInputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
            </select>
            <label className="text-white font-medium">Speaker</label>
            <select value={selectedSpeaker} onChange={handleAudioOutputChange} className="w-full p-2 rounded-lg bg-[#1E1F21] text-white">
              {audioOutputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
            </select>
            <label className="text-white font-medium">Mic Volume: {Math.round(localVolume*100)}%</label>
            <input type="range" min="0" max="1" step="0.01" value={localVolume} onChange={handleVolumeChange} className="w-full" />
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Noise Suppression</span>
              <button onClick={toggleNoiseSuppression} className={`w-12 h-6 rounded-full ${noiseSuppression ? 'bg-green-600' : 'bg-gray-400'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full transform ${noiseSuppression ? 'translate-x-6' : 'translate-x-1'}`}></span>
              </button>
            </div>
            <button onClick={toggleCamera} className={`w-full p-2 rounded-lg ${camera ? 'bg-green-600' : 'bg-gray-400'}`}>{camera ? 'Camera On' : 'Camera Off'}</button>
            <button onClick={toggleMic} className={`w-full p-2 rounded-lg ${mic ? 'bg-green-600' : 'bg-gray-400'}`}>{mic ? 'Mic On' : 'Mic Off'}</button>
          </div>
        )}

      </div>

      {/* ScreenShare Overlay (unchanged) */}
      {isScreenSharing && <ScreenShare stream={stream} />}

      {/* Admission Dialog (unchanged) */}
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
                  <button onClick={() => handleAdmit(user)} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700">Admit</button>
                  <button onClick={() => handleDeny(user)} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700">Deny</button>
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