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
  faCommentDots, faDesktop, faUserFriends, faCog, faShareAlt, faTimes,
  faSignOutAlt, faLanguage
} from '@fortawesome/free-solid-svg-icons';

// Define the global variable for the original user stream to restore it later
let localUserStream = null; 

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

  // Function to get the user's camera/mic stream
  const getStream = async (micId, video = true) => {
    // Stop existing tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: video, 
        audio: {
          deviceId: micId ? { exact: micId } : undefined,
          noiseSuppression,
          echoCancellation: true,
        },
      });
      
      setStream(newStream);
      if (userVideo.current) userVideo.current.srcObject = newStream;

      // Setup Audio Context for volume control
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

      // Apply initial toggle states
      const audioTrack = newStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = mic; 
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = camera; 
      
      return newStream; // Return the new stream
    } catch (error) {
      console.error("Error accessing media devices.", error);
      setCamera(false);
      setMic(false);
    }
  };


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

    // Get initial stream and store it globally for restoration after screen sharing
    getDevices();
    (async () => {
        localUserStream = await getStream(selectedMic);
    })();
    
    const joinRequestTimer = setTimeout(() => {
        setPendingParticipants(mockJoinRequests);
        setParticipants(prev => [...prev, mockJoinRequests[0]]);
    }, 5000);

    return () => {
      clearTimeout(joinRequestTimer);
      // Stop tracks on unmount. Check localUserStream too if screen share stopped it.
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (localUserStream) localUserStream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [name, selectedMic, localVolume, noiseSuppression, navigate, roomId]); 

  const toggleChat = () => setIsChatOpen(prev => !prev);
  const toggleSettings = () => setIsSettingsOpen(prev => !prev);
  const toggleParticipants = () => setIsParticipantsOpen(prev => !prev);
  const toggleEmojiPicker = () => setIsEmojiPickerOpen(prev => !prev);

  // 1. UPDATED toggleScreenShare FUNCTION
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      // Start Screen Sharing
      try {
        // Capture the screen (video) and optional system audio (audio)
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true // To capture system audio if permitted
        });

        // Capture the original microphone track from the user's camera stream
        const originalAudioTrack = localUserStream?.getAudioTracks()[0];
        
        // Replace the screen stream's audio track (if any) with the microphone track
        // This ensures others hear the user's voice, not just system audio, or use the camera stream's audio.
        if (originalAudioTrack) {
            screenStream.getTracks().forEach(track => {
                if (track.kind === 'audio') track.stop(); // Stop any system audio track
            });
            screenStream.addTrack(originalAudioTrack);
        }
        
        // Set the main stream to the screen stream
        setStream(screenStream);
        if (userVideo.current) userVideo.current.srcObject = screenStream;

        // Listen for the screen share 'ended' event (e.g., user clicks Stop Sharing in browser UI)
        screenStream.getVideoTracks()[0].onended = () => {
          // Stop the screen share and restore the camera stream
          toggleScreenShare(); 
        };

        setIsScreenSharing(true);
        console.log("Screen sharing started.");

      } catch (error) {
        console.error("Error starting screen share:", error);
        setIsScreenSharing(false);
      }
    } else {
      // Stop Screen Sharing
      if (stream) {
        stream.getTracks().forEach(track => {
            // Stop only the screen share tracks (video)
            if (track.kind === 'video' && track.label.includes('screen')) {
                track.stop();
            }
        });
      }
      
      // Restore the original camera stream
      if (localUserStream) {
          setStream(localUserStream);
          if (userVideo.current) userVideo.current.srcObject = localUserStream;
          // Re-apply mute status since we are reusing the stream object
          const audioTrack = localUserStream.getAudioTracks()[0];
          if (audioTrack) audioTrack.enabled = mic; 
      }
      
      setIsScreenSharing(false);
      console.log("Screen sharing stopped.");
    }
  };


  const sendReaction = (reaction) => {
    console.log(`Sending reaction: ${reaction}`);
    setIsEmojiPickerOpen(false); 
    setReactionNotification(reaction); 
    setTimeout(() => setReactionNotification(null), 3000);
  };

  const toggleHandRaise = () => {
    setIsHandRaised(prev => !prev);
    console.log(`Hand is now ${!isHandRaised ? 'raised' : 'lowered'}`);
  };

  const toggleCamera = () => {
    if (localUserStream) {
      const videoTrack = localUserStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !camera;
        setCamera(prev => !prev);
        return; 
      }
    }
    setCamera(prev => !prev);
  };

  const toggleMic = () => {
    if (localUserStream) {
      const audioTrack = localUserStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !mic;
        setMic(prev => !prev);
        return; 
      }
    }
    setMic(prev => !prev);
  };
  
  const handleAudioInputChange = (e) => setSelectedMic(e.target.value);
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

  const getGridContainerClass = (count) => {
    if (count === 1) return "flex items-center justify-center";
    if (count <= 2) return "grid grid-cols-2 grid-rows-1";
    if (count <= 4) return "grid grid-cols-2 grid-rows-2";
    if (count <= 6) return "grid grid-cols-3 grid-rows-2";
    if (count <= 9) return "grid grid-cols-3 grid-rows-3";
    return "grid grid-cols-4 grid-rows-4";
  };

  const getGridItemClass = (count) => {
      const base = "relative bg-[#1E1F21] rounded-xl overflow-hidden shadow-2xl w-full h-full";
      return count === 1 ? base : `${base} aspect-video`; 
  };

  const containerClass = getGridContainerClass(participants.length);
  const itemClass = getGridItemClass(participants.length);

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
      
      {reactionNotification && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-3 rounded-lg shadow-xl animate-bounce">
              {reactionNotification} Reaction Sent!
          </div>
      )}
      
      <div className="flex justify-between items-center p-4 bg-[#1E1F21] flex-shrink-0">
        <div className="flex items-center space-x-2 p-2 bg-[#1E1F21] text-white font-bold">
          <span>Meeting Code: {roomId}</span>
          <FontAwesomeIcon icon={faShareAlt} />
        </div>
        <div className="p-2 bg-[#1E1F21] text-white font-bold">Meeting Title</div>
        <div className="p-2 bg-[#1E1F21] text-white font-bold">Host Name</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="flex flex-col w-[50px] p-1 bg-[#1E1F21] items-center justify-between flex-shrink-0 h-full">
          
          <div className="flex flex-col items-center space-y-4 pt-4">
            <button onClick={toggleEmojiPicker} className={`text-2xl ${isEmojiPickerOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`} title="Send Reaction">
              <FontAwesomeIcon icon={faSmileWink} />
            </button>
            <button onClick={toggleHandRaise} className={`text-2xl ${isHandRaised ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`} title={isHandRaised ? "Lower Hand" : "Raise Hand"}>
              <FontAwesomeIcon icon={faHandPaper} />
            </button>
            <button onClick={toggleCamera} className={`text-2xl ${camera ? 'text-white' : 'text-red-500'} hover:text-white`} title={camera ? "Turn Camera Off" : "Turn Camera On"}>
              <FontAwesomeIcon icon={camera ? faVideo : faVideoSlash} />
            </button>
            <button onClick={toggleMic} className={`text-2xl ${mic ? 'text-white' : 'text-red-500'} hover:text-white`} title={mic ? "Turn Mic Off" : "Turn Mic On"}>
              <FontAwesomeIcon icon={mic ? faMicrophone : faMicrophoneSlash} />
            </button>
          </div>

          <button 
            onClick={() => { if(stream) stream.getTracks().forEach(t => t.stop()); navigate(`/prejoin/${roomId}`); }} 
            className="w-10 h-10 p-3 flex items-center justify-center bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors duration-200"
            title="Leave Meeting"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="text-xl"/>
          </button>

          <div className="flex flex-col items-center space-y-4">
            {/* The onClick for screen share is fixed here */}
            <button onClick={toggleScreenShare} className={`text-2xl ${isScreenSharing ? 'text-white' : 'text-gray-400 hover:text-white'}`} title="Screen Share">
              <FontAwesomeIcon icon={faDesktop} />
            </button>
            <button onClick={toggleChat} className={`text-2xl ${isChatOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`} title="Chat">
              <FontAwesomeIcon icon={faCommentDots} />
            </button>
            <Recording stream={stream} /> 
            <button className="text-2xl text-gray-400 hover:text-white transition-colors duration-200" title="Translation">
              <FontAwesomeIcon icon={faLanguage} />
            </button>
            <button onClick={toggleParticipants} className="text-2xl text-gray-400 hover:text-white transition-colors duration-200" title="Participants">
              <FontAwesomeIcon icon={faUserFriends} />
            </button>
          </div>

          <div className="flex flex-col items-center mb-2">
            <button onClick={toggleSettings} className="text-2xl text-gray-400 hover:text-white transition-colors duration-200" title="Settings">
              <FontAwesomeIcon icon={faCog} />
            </button>
          </div>
        </div>

        {isEmojiPickerOpen && <EmojiPicker />}

        <div className={`flex-1 transition-all duration-300 ${isChatOpen || isParticipantsOpen ? 'mr-80' : 'mr-0'} p-2 h-full w-full gap-2 ${containerClass}`}>
          {participants.map(user => (
            <div key={user.id} className={itemClass}>
              {user.id === 'me' ? (
                <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={user.videoUrl} alt={user.name} className="w-full h-full object-cover" />
              )}
              {user.id === 'me' && !camera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <span className="text-white text-lg font-semibold">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-sm">{user.name}</div>
            </div>
          ))}
        </div>

        {isChatOpen && <div className="absolute top-0 right-0 h-full w-80 z-40 transition-transform duration-300"><ChatBox /></div>}

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
      </div>

      {isScreenSharing && <ScreenShare stream={stream} />}

      {/* START: Audio Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#2E4242] p-6 rounded-xl shadow-2xl text-white max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Meeting Settings</h2>
              <button onClick={toggleSettings} className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            <h3 className="text-lg font-semibold mb-3 border-b border-gray-600 pb-2">Audio Settings 🎧</h3>

            {/* Microphone Input Select */}
            <div className="mb-4">
              <label htmlFor="micInput" className="block text-sm font-medium mb-1">Microphone Input</label>
              <select 
                id="micInput"
                value={selectedMic}
                onChange={handleAudioInputChange}
                className="w-full p-2 rounded bg-[#1E1F21] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              >
                {audioInputs.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker Output Select */}
            <div className="mb-4">
              <label htmlFor="speakerOutput" className="block text-sm font-medium mb-1">Speaker Output</label>
              <select 
                id="speakerOutput"
                value={selectedSpeaker}
                onChange={handleAudioOutputChange}
                className="w-full p-2 rounded bg-[#1E1F21] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              >
                {audioOutputs.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.substring(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Local Volume Control */}
            <div className="mb-4">
              <label htmlFor="localVolume" className="block text-sm font-medium mb-1">Local Volume ({Math.round(localVolume * 100)}%)</label>
              <input 
                type="range" 
                id="localVolume" 
                min="0" 
                max="2" 
                step="0.01" 
                value={localVolume} 
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
              />
            </div>

            {/* Noise Suppression Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Noise Suppression</span>
              <button 
                onClick={toggleNoiseSuppression} 
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${noiseSuppression ? 'bg-green-600' : 'bg-gray-700'}`}
                role="switch"
                aria-checked={noiseSuppression}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${noiseSuppression ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

          </div>
        </div>
      )}
      {/* END: Audio Settings Modal */}

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