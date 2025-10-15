import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChatBox from "./ChatBox";
import ScreenShare from "./ScreenShare";
import Recording from "./Recording";
import TranslationPanel from "./TranslationPanel";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSmileWink, faHandPaper,
  faVideo, faVideoSlash,
  faMicrophone, faMicrophoneSlash,
  faCommentDots, faDesktop, faUserFriends, faCog, faShareAlt, faTimes,
  faSignOutAlt, faLanguage
} from '@fortawesome/free-solid-svg-icons';

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8000";
  const { name, cameraOn, micOn, selectedAudioInput, selectedAudioOutput, isNoiseSuppressionOn } = location.state || {};

  const [stream, setStream] = useState(null);
  const userVideo = useRef(null);
  const [participants, setParticipants] = useState([]);
  const selfIdRef = useRef(null);
  const prevIdsRef = useRef(new Set());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
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
  const normalizeName = (value) => (value || "").toString().trim().toLowerCase().replace(/\s+/g, " ");

  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);
  const [sharingUser, setSharingUser] = useState(null);
  const screenVideoRef = useRef(null);
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const pendingRemoteScreenRef = useRef(null);

  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  useEffect(() => {
    if (!name) {
      navigate(`/prejoin/${roomId}`);
      return;
    }

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
        setParticipants(prev => [{ id: 'me', name: name, stream: newStream }, ...prev.filter(p => p.id !== 'me')]);

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

    // ✅ ENHANCED: Setup RTCPeerConnection with better handlers
    if (!peerRef.current) {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.onicecandidate = (e) => {
        if (e.candidate && wsRef.current) {
          try {
            wsRef.current.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate }));
          } catch (_) {}
        }
      };
      
      // ✅ ENHANCED: Better ontrack handler
      pc.ontrack = (evt) => {
        console.log('🎥 Received remote track:', evt.track.kind);
        const ms = evt.streams[0];
        
        if (ms) {
          console.log('✅ Remote stream received with', ms.getTracks().length, 'tracks');
          pendingRemoteScreenRef.current = ms;
          
          // Set the stream to the screen video element
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = ms;
            console.log('✅ Screen video element updated');
            
            // Ensure video plays
            screenVideoRef.current.play().catch(e => {
              console.error('Error playing screen video:', e);
            });
          }
        } else {
          console.error('❌ No stream in ontrack event');
        }
      };
      
      pc.onconnectionstatechange = () => {
        console.log('🔌 Connection state:', pc.connectionState);
      };
      
      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState);
      };
      
      dataChannelRef.current = pc.createDataChannel('meta');
      peerRef.current = pc;
    }

    const token = sessionStorage.getItem("access_token");

    // Poll real participants from backend
    let pollTimer;
    const fetchParticipants = async () => {
      if (!token) return;
      try {
        console.log('🔄 Fetching participants from API...');
        const res = await fetch(`${API_BASE}/api/v1/sessions/${roomId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        console.log('📡 API Response status:', res.status);
        if (!res.ok) {
          console.error('❌ API call failed:', res.status, res.statusText);
          return;
        }
        const data = await res.json();
        console.log('📊 Raw API response:', data);
        
        // ✅ ENHANCED: Setup WebSocket with better error handling
        if (!ws && data?.session_id && data?.participants) {
          const derivedRoomId = data?.room_id || "";
          if (derivedRoomId) {
            const wsBase = API_BASE.replace(/^http/, 'ws').replace(/\/$/, '');
            const wsUrl = `${wsBase}/ws/${derivedRoomId}?token=${token}`;
            console.log('🔌 Connecting to WebSocket:', wsUrl);
            
            const sock = new WebSocket(wsUrl);
            
            sock.onopen = () => {
              console.log('✅ WebSocket connected');
            };
            
            // ✅ ENHANCED: Complete WebSocket message handler
            sock.onmessage = async (evt) => {
              try {
                const msg = JSON.parse(evt.data);
                console.log('📨 WebSocket message:', msg.type);
                
                // Handle screenshare-started
                if (msg.type === 'screenshare-started') {
                  console.log(`📺 ${msg.full_name} started sharing screen`);
                  setSharingUser({ userId: msg.user_id, fullName: msg.full_name });
                  console.log('⏳ Waiting for remote screen stream via WebRTC...');
                } 
                
                // Handle screenshare-stopped
                else if (msg.type === 'screenshare-stopped') {
                  console.log(`📺 ${msg.full_name} stopped sharing screen`);
                  setSharingUser(null);
                  if (screenVideoRef.current) {
                    screenVideoRef.current.srcObject = null;
                  }
                  pendingRemoteScreenRef.current = null;
                } 
                
                // Handle WebRTC offer
                else if (msg.type === 'offer') {
                  console.log('📥 Received WebRTC offer');
                  await peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                  const answer = await peerRef.current.createAnswer();
                  await peerRef.current.setLocalDescription(answer);
                  console.log('📤 Sending WebRTC answer');
                  sock.send(JSON.stringify({ type: 'answer', sdp: answer }));
                } 
                
                // Handle WebRTC answer
                else if (msg.type === 'answer') {
                  console.log('📥 Received WebRTC answer');
                  await peerRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                } 
                
                // Handle ICE candidate
                else if (msg.type === 'ice-candidate' && msg.candidate) {
                  console.log('📥 Received ICE candidate');
                  try { 
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); 
                    console.log('✅ ICE candidate added');
                  } catch (e) {
                    console.error('❌ Error adding ICE candidate:', e);
                  }
                }
                
                // Handle chat messages
                else if (msg.type === 'chat-message') {
                  console.log('💬 Chat message from', msg.full_name);
                }
                
                // Handle user left
                else if (msg.type === 'user_left') {
                  console.log('👋 User left:', msg.user_id);
                }
                
              } catch (e) {
                console.error('❌ Error handling WebSocket message:', e);
              }
            };
            
            sock.onerror = (error) => {
              console.error('❌ WebSocket error:', error);
            };
            
            sock.onclose = () => {
              console.log('🔌 WebSocket disconnected');
              setWs(null);
              wsRef.current = null;
            };
            
            setWs(sock);
            wsRef.current = sock;
          }
        }
        
        const serverParticipants = (data?.participants || []).map(p => ({ id: p.user_id, name: p.full_name }));
        
        // ✅ DEBUG: Log participant information
        console.log('📊 Current participants:', serverParticipants);
        console.log('📊 Current self ID:', selfIdRef.current);
        console.log('📊 Current name:', name);
        console.log('📊 Previous IDs:', Array.from(prevIdsRef.current));
        console.log('📊 Participant count:', serverParticipants.length);
        
        // ✅ ENHANCED: Better self-detection logic for new users
        const newIds = new Set(serverParticipants.map(p => p.id));
        console.log('📊 New IDs:', Array.from(newIds));
        
        // If we don't have a self ID yet, try to detect it
        if (!selfIdRef.current) {
          // Method 1: Check for newly appeared participants (most reliable for new joins)
          const diff = [...newIds].filter(id => !prevIdsRef.current.has(id));
          console.log('📊 New participant IDs:', diff);
          
          if (diff.length === 1) {
            selfIdRef.current = diff[0];
            console.log('🎯 Self detected by new participant ID:', selfIdRef.current);
          } else {
            // Method 2: Name-based matching (fallback)
            const matches = serverParticipants.filter(p => normalizeName(p.name) === normalizeName(name));
            console.log('📊 Name matches for', name, ':', matches);
            
            if (matches.length === 1) {
              selfIdRef.current = matches[0].id;
              console.log('🎯 Self detected by name match:', selfIdRef.current);
            } else if (matches.length > 1) {
              // If multiple matches, use the most recent one (last in array)
              selfIdRef.current = matches[matches.length - 1].id;
              console.log('🎯 Self detected by multiple name matches, using latest:', selfIdRef.current);
            } else {
              // Method 3: If no matches, use the first participant (fallback)
              if (serverParticipants.length > 0) {
                selfIdRef.current = serverParticipants[0].id;
                console.log('🎯 Self detected by fallback (first participant):', selfIdRef.current);
              }
            }
          }
        }
        
        // ✅ ENHANCED: Reset self ID if current user is no longer in participants
        if (selfIdRef.current && !newIds.has(selfIdRef.current)) {
          console.log('🔄 Self ID no longer in participants, resetting...');
          selfIdRef.current = null;
        }
        
        // ✅ CRITICAL: Only bind camera to the correct user's tile
        if (selfIdRef.current && userVideo.current && stream) {
          console.log('🎥 Binding camera to self ID:', selfIdRef.current);
          const current = userVideo.current;
          if (current.srcObject !== stream) {
            current.srcObject = stream;
            setTimeout(() => {
              current.play().catch(e => console.error('Error playing video:', e));
            }, 100);
          }
        }
        prevIdsRef.current = newIds;
        
        // ✅ CRITICAL: Force participant update
        console.log('🔄 Updating participants in UI:', serverParticipants);
        setParticipants(serverParticipants);
        
        // ✅ FORCE: Trigger re-render if participants changed
        if (serverParticipants.length !== participants.length) {
          console.log('📈 Participant count changed from', participants.length, 'to', serverParticipants.length);
          console.log('🔄 Forcing participant update...');
          setParticipants([...serverParticipants]);
          
          // ✅ ADDITIONAL: Force a complete re-render
          setTimeout(() => {
            setParticipants(serverParticipants);
            console.log('🔄 Final participant update completed');
          }, 100);
        }
      } catch (_e) {
        console.error('Error fetching participants:', _e);
      }
    };
    
    fetchParticipants();
    pollTimer = setInterval(fetchParticipants, 1000); // ✅ FASTER: 1 second polling

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (ws) ws.close();
    };
  }, [name, selectedMic, localVolume, noiseSuppression, navigate, roomId, API_BASE]);

  // ✅ SIMPLIFIED: Single camera binding effect - ONLY for self
  useEffect(() => {
    if (userVideo.current && stream && selfIdRef.current) {
      const current = userVideo.current;
      if (current.srcObject !== stream) {
        current.srcObject = stream;
        console.log('🎥 Video element updated with local stream for self');
        
        // Use setTimeout to avoid play() interruption
        setTimeout(() => {
          current.play().catch(e => console.error('❌ Error playing local video:', e));
        }, 100);
      }
    }
  }, [stream, selfIdRef.current]);


  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
    if (isTranslationPanelOpen) setIsTranslationPanelOpen(false);
    if (isParticipantsOpen) setIsParticipantsOpen(false);
  };
  
  const toggleScreenShare = () => setIsScreenSharing(prev => !prev);
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
            onClick={async () => {
              const token = sessionStorage.getItem("access_token");
              if (!token) { navigate("/"); return; }
              try {
                await fetch(`${API_BASE}/api/v1/sessions/${roomId}/end`, {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${token}` }
                });
              } catch (e) {
              } finally {
                if (stream) stream.getTracks().forEach(t => t.stop());
                navigate(`/`);
              }
            }}
            className="w-10 h-10 p-3 flex items-center justify-center bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors duration-200"
            title="Leave Meeting"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="text-xl"/>
          </button>

          <div className="flex flex-col items-center space-y-4">
            <button onClick={toggleScreenShare} className={`text-2xl ${isScreenSharing ? 'text-white' : 'text-gray-400 hover:text-white'}`} title="Screen Share">
              <FontAwesomeIcon icon={faDesktop} />
            </button>
            <button onClick={toggleChat} className={`text-2xl ${isChatOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`} title="Chat">
              <FontAwesomeIcon icon={faCommentDots} />
            </button>
          <Recording stream={stream} sessionId={roomId} />
            <button onClick={toggleTranslationPanel} className={`text-2xl ${isTranslationPanelOpen ? 'text-white' : 'text-gray-400 hover:text-white'} transition-colors duration-200`} title="Translation & Transcription">
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

        <div className={`flex-1 transition-all duration-300 ${
          isChatOpen || isParticipantsOpen || isTranslationPanelOpen ? 'mr-80' : 'mr-0'
        } p-2 h-full w-full gap-2 ${containerClass}`}>
          {participants.map(user => (
            <div key={user.id} className={itemClass}>
              {user.id === selfIdRef.current ? (
                <video
                  ref={userVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onCanPlay={() => { try { userVideo.current && userVideo.current.play(); } catch (_) {} }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1E1F21]">
                  <span className="text-white text-lg font-semibold">{user.name}</span>
                </div>
              )}
              {user.id === selfIdRef.current && !camera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <span className="text-white text-lg font-semibold">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-sm">{user.name}</div>
            </div>
          ))}
        </div>

        {isChatOpen && <div className="absolute top-0 right-0 h-full w-80 z-40 transition-transform duration-300"><ChatBox sessionId={roomId} selfName={name} /></div>}

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

        {isTranslationPanelOpen && <TranslationPanel onClose={() => setIsTranslationPanelOpen(false)} />}
      </div>

      {/* ✅ ENHANCED: Screen Share Component with better WebRTC handling */}
      {isScreenSharing && <div className="absolute bottom-4 left-20 z-40">
        <ScreenShare
          stream={stream}
          sessionId={roomId}
          onStart={async (displayStream) => {
            try {
              console.log('📺 Starting screen share - adding tracks to peer connection');
              // Add screen tracks to peer connection and renegotiate
              displayStream.getTracks().forEach(t => {
                console.log('➕ Adding track:', t.kind);
                peerRef.current.addTrack(t, displayStream);
              });
              
              const offer = await peerRef.current.createOffer();
              await peerRef.current.setLocalDescription(offer);
              console.log('📤 Sending WebRTC offer for screen share');
              if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'offer', sdp: offer }));
            } catch (e) { 
              console.error('❌ Error starting screen share:', e); 
            }
          }}
          onStop={async () => {
            try {
              console.log('🛑 Stopping screen share - removing tracks');
              // Remove screen tracks from PC and renegotiate
              peerRef.current.getSenders().forEach(sender => {
                if (sender.track && sender.track.kind === 'video') {
                  console.log('➖ Removing track:', sender.track.kind);
                  sender.replaceTrack(null).catch(() => {});
                }
              });
              
              const offer = await peerRef.current.createOffer();
              await peerRef.current.setLocalDescription(offer);
              console.log('📤 Sending WebRTC offer after stopping screen share');
              if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'offer', sdp: offer }));
            } catch (e) { 
              console.error('❌ Error stopping screen share:', e); 
            }
          }}
        />
      </div>}

      {/* Remote screen share preview */}
      {sharingUser && (
        <div className="absolute top-16 right-4 z-30 w-[420px] h-[260px] bg-black rounded-lg overflow-hidden shadow-xl border border-gray-700">
          <div className="text-xs text-white bg-black/60 px-2 py-1">{sharingUser.fullName} is presenting…</div>
          <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
        </div>
      )}

      {/* SETTINGS MODAL - COMPLETED */}
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
    </div>
  );
}

export default Room;