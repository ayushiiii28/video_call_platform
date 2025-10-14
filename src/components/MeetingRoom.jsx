// MeetingRoom.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
// Ensure these imports are available in your project structure
import ChatBox from "./ChatBox"; 
import ScreenShare from "./ScreenShare"; // The button component
import Recording from "./Recording";
import TranslationPanel from "./TranslationPanel";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSmileWink, faHandPaper,
    faVideo, faVideoSlash,
    faMicrophone, faMicrophoneSlash,
    faCommentDots, faUserFriends, faCog, faShareAlt, faTimes,
    faSignOutAlt, faLanguage,
    faDesktop 
} from '@fortawesome/free-solid-svg-icons';

// 1. CUSTOM IMAGE IMPORT: Assuming 'OneVoiceIcon.jpg' is in your src/assets folder
import TranslationIconImage from './OneVoiceIcon.png'; // **ADJUST PATH IF NECESSARY**

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
    
    // STATES for Screen Sharing
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenStream, setScreenStream] = useState(null); 
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [reactionNotification, setReactionNotification] = useState(null);
    const [handRaiseNotification, setHandRaiseNotification] = useState(null);
    const [isTranslationPanelOpen, setIsTranslationPanelOpen] = useState(false);

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

    useEffect(() => {
        if (!name) {
            navigate(`/prejoin/${roomId}`);
            return;
        }

        // Initialize participants only on mount
        setParticipants([{ id: 'me', name: name, stream: null, videoUrl: "https://placehold.co/600x400/3E76E8/ffffff?text=Me" }]);

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
            if (stream) stream.getTracks().forEach(track => track.stop());

            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: {
                        deviceId: micId ? { exact: micId } : undefined,
                        noiseSuppression,
                        echoCancellation: true,
                    },
                });
                setStream(newStream);
                if (userVideo.current) userVideo.current.srcObject = newStream;

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

                const audioTrack = newStream.getAudioTracks()[0];
                if (audioTrack) audioTrack.enabled = mic;
                const videoTrack = newStream.getVideoTracks()[0];
                if (videoTrack) videoTrack.enabled = camera;

            } catch (error) {
                console.error("Error accessing media devices.", error);
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
            // Cleanup logic for streams
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (screenStream) screenStream.getTracks().forEach(track => track.stop()); 
            if (audioContextRef.current) audioContextRef.current.close();
        };
    // Dependencies only include states/props that should trigger a re-setup.
    }, [name, selectedMic, localVolume, noiseSuppression, navigate, roomId, camera, mic]); 
    

    const toggleChat = () => {
        setIsChatOpen(prev => !prev);
        if (isTranslationPanelOpen) setIsTranslationPanelOpen(false);
        if (isParticipantsOpen) setIsParticipantsOpen(false);
    };
    
    const toggleSettings = () => setIsSettingsOpen(prev => !prev);
    const toggleParticipants = () => {
        setIsParticipantsOpen(prev => !prev);
        if (isChatOpen) setIsChatOpen(false);
        if (isTranslationPanelOpen) setIsTranslationPanelOpen(false);
    };
    const toggleEmojiPicker = () => setIsEmojiPickerOpen(prev => !prev);
    const toggleTranslationPanel = () => {
        setIsTranslationPanelOpen(prev => !prev);
        if (isChatOpen) setIsChatOpen(false);
        if (isParticipantsOpen) setIsParticipantsOpen(false);
    };

    const sendReaction = (reaction) => {
        console.log(`Sending reaction: ${reaction}`);
        setIsEmojiPickerOpen(false);
        setReactionNotification(reaction);
        setTimeout(() => setReactionNotification(null), 3000);
    };

    const toggleHandRaise = () => {
        setIsHandRaised(prev => {
            const newState = !prev;
            if (newState) {
                const message = `${name} has raised their hand ✋!`;
                setHandRaiseNotification(message);
                setTimeout(() => setHandRaiseNotification(null), 5000);
            } else {
                setHandRaiseNotification(null);
            }
            console.log(`Hand is now ${newState ? 'raised' : 'lowered'}`);
            return newState;
        });
    };

    const toggleCamera = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !camera;
                setCamera(prev => !prev);
                return;
            }
        }
        setCamera(prev => !prev);
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !mic;
                setMic(prev => !prev);
                return;
            }
        }
        setMic(prev => !prev);
    };

    const handleAudioInputChange = (e) => {
        setSelectedMic(e.target.value);
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

    // Component to display the shared screen video stream
    const ScreenShareDisplay = ({ screenStream }) => {
        const videoRef = useRef(null);
        
        useEffect(() => {
            if (videoRef.current && screenStream) {
                videoRef.current.srcObject = screenStream;
            }
        }, [screenStream]);

        if (!screenStream) {
             return (
                 <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl">
                     <span className="text-xl text-gray-400">Screen share disconnected...</span>
                 </div>
             );
        }

        return (
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted 
                className="w-full h-full object-contain bg-black rounded-xl shadow-2xl"
            />
        );
    };

    // Reusable component for participant video tiles
    const ParticipantTile = ({ user, isMinimized = false }) => (
        <div key={user.id} className={`relative bg-[#1E1F21] rounded-xl overflow-hidden shadow-2xl ${isMinimized ? 'w-full h-full' : 'w-full h-full'}`}>
            {user.id === 'me' ? (
                <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
                <img src={user.videoUrl} alt={user.name} className="w-full h-full object-cover" />
            )}
            {user.id === 'me' && !camera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <span className="text-white text-sm font-semibold">Camera Off</span>
                </div>
            )}
            <div className={`absolute ${isMinimized ? 'bottom-1 left-1' : 'bottom-2 left-2'} text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-xs`}>
                {user.name}
            </div>
        </div>
    );

    // Minimized Participants Strip
    const MinimizedParticipants = () => (
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-[#1E1F21] bg-opacity-80 flex space-x-2 p-2 overflow-x-auto z-30">
            {participants.map(user => (
                <div key={user.id} className="flex-shrink-0 w-32 h-24">
                    <ParticipantTile user={user} isMinimized={true} />
                </div>
            ))}
        </div>
    );

    // CORE LAYOUT LOGIC: Switch between Screen Share and Gallery View
    const renderMainContent = () => {
        if (isScreenSharing && screenStream) {
            return (
                <div className="relative flex-1 h-full w-full">
                    {/* Main screen share area, padded at the bottom for the minimized strip */}
                    <div className="w-full h-full pb-28">
                        <ScreenShareDisplay screenStream={screenStream} /> 
                    </div>
                    {/* Minimized participant videos at the bottom */}
                    <MinimizedParticipants />
                </div>
            );
        }

        // Gallery View (Original Logic)
        return (
            <div className={`flex-1 p-2 h-full w-full gap-2 ${containerClass}`}>
                {participants.map(user => (
                    <div key={user.id} className={itemClass}>
                        <ParticipantTile user={user} />
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="flex flex-col h-screen w-screen bg-[#1D2C2A] text-[#E8E7E5] font-sans">

            {reactionNotification && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-3 rounded-lg shadow-xl animate-bounce">
                    {reactionNotification} Reaction Sent!
                </div>
            )}
            
            {handRaiseNotification && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-black p-3 rounded-lg shadow-xl font-bold animate-pulse">
                    {handRaiseNotification}
                </div>
            )}

            <div className="flex justify-between items-center p-4 bg-[#1E1F21] flex-shrink-0">
                <div className="flex items-center space-x-2 p-2 bg-[#1E1F21] text-white font-bold">
                    <span>Meeting Code: {roomId}</span>
                    <FontAwesomeIcon icon={faShareAlt} />
                </div>
                <div className="p-2 bg-[#1E1F21] text-white font-bold">Meeting Title</div>
                {/* HOST NAME UPDATE */}
                <div className="p-2 bg-[#1E1F21] text-white font-bold">Host: {name}</div> 
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar (Controls) */}
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
                        {/* ScreenShare button with stream logic props */}
                        <ScreenShare 
                            isSharing={isScreenSharing} 
                            setIsSharing={setIsScreenSharing} 
                            setScreenStream={setScreenStream} 
                        />
                        <button onClick={toggleChat} className={`text-2xl ${isChatOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`} title="Chat">
                            <FontAwesomeIcon icon={faCommentDots} />
                        </button>
                        <Recording stream={stream} />
                        
                        {/* 2. CUSTOM IMAGE BUTTON IMPLEMENTATION */}
                        <button 
                            onClick={toggleTranslationPanel} 
                            // Set a fixed size (w-10 h-10) and manage background color for active state
                            className={`w-10 h-10 p-1 flex items-center justify-center rounded-lg transition-colors duration-200 ${isTranslationPanelOpen ? 'bg-gray-600' : 'hover:bg-gray-700'}`} 
                            title="Translation & Transcription"
                        >
                            <img 
                                src={TranslationIconImage} 
                                alt="OneVoice Translation Icon" 
                                className="w-full h-full object-contain" 
                            />
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

                {/* MAIN CONTENT AREA: Renders the screen share or gallery view */}
                <div className={`flex-1 transition-all duration-300 ${
                    isChatOpen || isParticipantsOpen || isTranslationPanelOpen ? 'mr-80' : 'mr-0'
                } p-2 h-full w-full`}>
                    {renderMainContent()}
                </div>

                {/* Right Side Panels */}
                {isChatOpen && <div className="absolute top-0 right-0 h-full w-80 z-40 transition-transform duration-300"><ChatBox /></div>}

                {isParticipantsOpen && (
                    <div className="absolute top-0 right-0 h-full w-80 z-50 bg-[#1E1F21] p-4 overflow-y-auto shadow-xl transition-transform duration-300">
                        <h2 className="text-2xl font-bold mb-4">Participants</h2>
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

                {isTranslationPanelOpen && <TranslationPanel onClose={() => setIsTranslationPanelOpen(false)} />}
            </div>

            {/* SETTINGS MODAL */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                    <div className="bg-[#2E4242] p-8 rounded-xl shadow-2xl text-white max-w-lg w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Audio/Video Settings</h2>
                            <button onClick={toggleSettings} className="text-gray-400 hover:text-white text-3xl" title="Close Settings">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Audio Input Selector */}
                        <div className="mb-4">
                            <label htmlFor="mic-select" className="block text-sm font-semibold mb-2">Microphone (Input):</label>
                            <select
                                id="mic-select"
                                value={selectedMic}
                                onChange={handleAudioInputChange}
                                className="w-full p-2 bg-[#1E1F21] border border-gray-600 rounded-lg text-white"
                            >
                                {audioInputs.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId}`}</option>
                                ))}
                            </select>
                        </div>

                        {/* Audio Output Selector */}
                        <div className="mb-4">
                            <label htmlFor="speaker-select" className="block text-sm font-semibold mb-2">Speaker (Output):</label>
                            <select
                                id="speaker-select"
                                value={selectedSpeaker}
                                onChange={handleAudioOutputChange}
                                className="w-full p-2 bg-[#1E1F21] border border-gray-600 rounded-lg text-white"
                            >
                                {audioOutputs.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Speaker ${device.deviceId}`}</option>
                                ))}
                            </select>
                        </div>

                        {/* Local Volume Control */}
                        <div className="mb-4">
                            <label htmlFor="local-volume" className="block text-sm font-semibold mb-2">Local Microphone Volume (For Testing):</label>
                            <input
                                id="local-volume"
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={localVolume}
                                onChange={handleVolumeChange}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-400">Current Value: {localVolume.toFixed(1)}</span>
                        </div>

                        {/* Noise Suppression Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Noise Suppression</span>
                            <button
                                onClick={toggleNoiseSuppression}
                                className={`px-4 py-2 rounded-lg font-bold transition-colors ${noiseSuppression ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {noiseSuppression ? 'ON' : 'OFF'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* PENDING PARTICIPANTS MODAL */}
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