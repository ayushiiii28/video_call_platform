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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const peerConnections = useRef(new Map());
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

  // ✅ CRITICAL FIX: Get current user ID from backend
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = sessionStorage.getItem("access_token");
      if (!token) return;
      
      try {
        // Fetch current user profile to get their UUID
        const response = await fetch(`${API_BASE}/api/v1/users/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('🔑 Current user data from API:', userData);
          
          const userId = userData.id || userData.user_id;
          if (userId) {
            setCurrentUserId(userId);
            selfIdRef.current = userId;
            console.log('✅ Current user ID set from API:', userId);
          }
        } else {
          // Fallback: Try to decode from token
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userEmail = payload.sub || payload.email;
          console.log('⚠️ Using email from token as fallback:', userEmail);
          setCurrentUserId(userEmail);
        }
      } catch (e) {
        console.error('❌ Error fetching current user:', e);
      }
    };
    
    fetchCurrentUser();
  }, [API_BASE]); // Run ONCE on mount

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
        console.log('🎥 Local stream created:', newStream.id);

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
      
      pc.ontrack = (evt) => {
        console.log('🎥 Received remote track:', evt.track.kind);
        const ms = evt.streams[0];
        
        if (ms) {
          console.log('✅ Remote stream received');
          pendingRemoteScreenRef.current = ms;
          
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = ms;
            screenVideoRef.current.play().catch(e => console.error('Error playing screen video:', e));
          }
        }
      };
      
      dataChannelRef.current = pc.createDataChannel('meta');
      peerRef.current = pc;
    }

    const token = sessionStorage.getItem("access_token");

    let pollTimer;
    const fetchParticipants = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/v1/sessions/${roomId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) return;
        
        const data = await res.json();
        console.log('📊 Participants from API:', data.participants);
        
        // ✅ Setup WebSocket if not already connected
        if (!ws && data?.room_id) {
          const wsBase = API_BASE.replace(/^http/, 'ws').replace(/\/$/, '');
          const wsUrl = `${wsBase}/ws/${data.room_id}?token=${token}`;
          console.log('🔌 Connecting to WebSocket:', wsUrl);
          
          const sock = new WebSocket(wsUrl);
          
          sock.onopen = () => console.log('✅ WebSocket connected');
          
          sock.onmessage = async (evt) => {
            try {
              const msg = JSON.parse(evt.data);
              console.log('📨 WebSocket message:', msg.type);
              
              if (msg.type === 'screenshare-started') {
                console.log(`📺 ${msg.full_name} started sharing`);
                setSharingUser({ userId: msg.user_id, fullName: msg.full_name });
              } 
              else if (msg.type === 'screenshare-stopped') {
                console.log(`📺 ${msg.full_name} stopped sharing`);
                setSharingUser(null);
                if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
              } 
              else if (msg.type === 'offer') {
                const pc = peerConnections.current.get(msg.from);
                if (pc) {
                  await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  sock.send(JSON.stringify({ type: 'answer', sdp: answer, to: msg.from }));
                }
              } 
              else if (msg.type === 'answer') {
                const pc = peerConnections.current.get(msg.from);
                if (pc) await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              } 
              else if (msg.type === 'ice-candidate' && msg.candidate) {
                const pc = peerConnections.current.get(msg.from);
                if (pc) {
                  try { 
                    await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); 
                  } catch (e) {
                    console.error('❌ ICE error:', e);
                  }
                }
              }
            } catch (e) {
              console.error('❌ WebSocket message error:', e);
            }
          };
          
          sock.onerror = (error) => console.error('❌ WebSocket error:', error);
          sock.onclose = () => {
            console.log('🔌 WebSocket disconnected');
            setWs(null);
            wsRef.current = null;
          };
          
          setWs(sock);
          wsRef.current = sock;
        }
        
        // ✅ CRITICAL: Map participants
        const serverParticipants = (data?.participants || []).map(p => {
          console.log('🔍 Raw participant from API:', p);
          
          // ✅ Set current user's role if this is them
          if (p.user_id === currentUserId || p.user_id === selfIdRef.current) {
            setCurrentUserRole(p.role);
            console.log('👑 Current user role set:', p.role);
          }
          
          return {
            id: p.user_id,
            name: p.full_name,
            email: p.email || null,
            role: p.role
          };
        });
        
        console.log('📊 Mapped participants:', serverParticipants);
        console.log('🔑 Current user ID (selfIdRef):', selfIdRef.current);
        console.log('🔑 Current user state:', currentUserId);
        console.log('👑 Current user role:', currentUserRole);
        
        setParticipants(serverParticipants);
        
      } catch (e) {
        console.error('❌ Fetch participants error:', e);
      }
    };
    
    fetchParticipants();
    pollTimer = setInterval(fetchParticipants, 2000);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (ws) ws.close();
    };
  }, [name, selectedMic, localVolume, noiseSuppression, navigate, roomId, API_BASE]);

  // ✅ CRITICAL FIX: Only bind camera when we have BOTH stream AND confirmed self ID
  useEffect(() => {
    if (userVideo.current && stream && selfIdRef.current) {
      const current = userVideo.current;
      
      // Only update if not already set
      if (current.srcObject !== stream) {
        current.srcObject = stream;
        console.log('🎥 Camera bound to self:', selfIdRef.current);
        
        setTimeout(() => {
          current.play().catch(e => console.error('❌ Error playing video:', e));
        }, 100);
      }
    }
  }, [stream, selfIdRef.current]);

  // ✅ WebRTC peer connections for multi-user video
  useEffect(() => {
    if (!ws || !stream || !currentUserId) return;

    const setupPeerConnection = async (userId) => {
      if (peerConnections.current.has(userId) || userId === currentUserId) return;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('➕ Added local track:', track.kind);
      });

      pc.ontrack = (event) => {
        console.log('📥 Received remote track from:', userId);
        const remoteStream = event.streams[0];
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, remoteStream);
          return newMap;
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && ws) {
          ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            target: userId
          }));
        }
      };

      peerConnections.current.set(userId, pc);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (ws) {
          ws.send(JSON.stringify({
            type: 'offer',
            sdp: offer,
            to: userId
          }));
        }
      } catch (e) {
        console.error('❌ Error creating offer:', e);
      }
    };

    participants.forEach(participant => {
      if (participant.id !== currentUserId) {
        setupPeerConnection(participant.id);
      }
    });

    return () => {
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
    };
  }, [ws, stream, participants, currentUserId]);

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
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  // ✅ CRITICAL FIX: Simple self-detection using UUID
  const isCurrentUserParticipant = (participant) => {
    // Use selfIdRef (UUID) to match
    if (selfIdRef.current && participant.id === selfIdRef.current) {
      return true;
    }
    
    // Fallback: Use currentUserId state
    if (currentUserId && participant.id === currentUserId) {
      return true;
    }
    
    return false;
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
        <div className="p-2 bg-[#1E1F21] text-white font-bold">Host Name</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-[50px] p-1 bg-[#1E1F21] items-center justify-between flex-shrink-0 h-full">
          <div className="flex flex-col items-center space-y-4 pt-4">
            <button onClick={toggleEmojiPicker} className={`text-2xl ${isEmojiPickerOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <FontAwesomeIcon icon={faSmileWink} />
            </button>
            <button onClick={toggleHandRaise} className={`text-2xl ${isHandRaised ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <FontAwesomeIcon icon={faHandPaper} />
            </button>
            <button onClick={toggleCamera} className={`text-2xl ${camera ? 'text-white' : 'text-red-500'} hover:text-white`}>
              <FontAwesomeIcon icon={camera ? faVideo : faVideoSlash} />
            </button>
            <button onClick={toggleMic} className={`text-2xl ${mic ? 'text-white' : 'text-red-500'} hover:text-white`}>
              <FontAwesomeIcon icon={mic ? faMicrophone : faMicrophoneSlash} />
            </button>
          </div>

          {/* ✅ Show different buttons based on user role */}
          {currentUserRole === 'HOST' ? (
            // Host can end the session for everyone
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
                  console.error('❌ Error ending session:', e);
                } finally {
                  if (stream) stream.getTracks().forEach(t => t.stop());
                  navigate(`/`);
                }
              }}
              className="w-10 h-10 p-3 flex items-center justify-center bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors duration-200"
              title="End Session (Host Only)"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="text-xl"/>
            </button>
          ) : (
            // Regular participants can only leave
            <button
              onClick={async () => {
                const token = sessionStorage.getItem("access_token");
                if (!token) { navigate("/"); return; }
                try {
                  await fetch(`${API_BASE}/api/v1/sessions/${roomId}/participants/me`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                  });
                } catch (e) {
                  console.error('❌ Error leaving session:', e);
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
          )}

          <div className="flex flex-col items-center space-y-4">
            <button onClick={toggleScreenShare} className={`text-2xl ${isScreenSharing ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <FontAwesomeIcon icon={faDesktop} />
            </button>
            <button onClick={toggleChat} className={`text-2xl ${isChatOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <FontAwesomeIcon icon={faCommentDots} />
            </button>
            <Recording stream={stream} sessionId={roomId} />
            <button onClick={toggleTranslationPanel} className={`text-2xl ${isTranslationPanelOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <FontAwesomeIcon icon={faLanguage} />
            </button>
            <button onClick={toggleParticipants} className="text-2xl text-gray-400 hover:text-white">
              <FontAwesomeIcon icon={faUserFriends} />
            </button>
          </div>

          <div className="flex flex-col items-center mb-2">
            <button onClick={toggleSettings} className="text-2xl text-gray-400 hover:text-white">
              <FontAwesomeIcon icon={faCog} />
            </button>
          </div>
        </div>

        {isEmojiPickerOpen && <EmojiPicker />}

        <div className={`flex-1 transition-all duration-300 ${
          isChatOpen || isParticipantsOpen || isTranslationPanelOpen ? 'mr-80' : 'mr-0'
        } p-2 h-full w-full gap-2 ${containerClass}`}>
          {participants.map(user => {
            const isSelf = isCurrentUserParticipant(user);
            
            console.log('🎯 Rendering participant:', user.name, 'isSelf:', isSelf, 'userId:', user.id);
            
            return (
              <div key={user.id} className={itemClass}>
                {isSelf ? (
                  <video
                    ref={userVideo}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  remoteStreams.has(user.id) ? (
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      ref={(el) => {
                        if (el && remoteStreams.has(user.id)) {
                          el.srcObject = remoteStreams.get(user.id);
                          el.play().catch(() => {});
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1E1F21]">
                      <span className="text-white text-lg font-semibold">{user.name}</span>
                    </div>
                  )
                )}
                {isSelf && !camera && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <span className="text-white text-lg font-semibold">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-sm">
                  {user.name} {isSelf && '(You)'}
                </div>
              </div>
            );
          })}
        </div>

        {isChatOpen && <div className="absolute top-0 right-0 h-full w-80 z-40"><ChatBox sessionId={roomId} selfName={name} /></div>}

        {isParticipantsOpen && (
          <div className="absolute top-0 right-0 h-full w-80 z-50 bg-[#1E1F21] p-4 overflow-y-auto shadow-xl">
            <h2 className="text-white font-bold mb-4">Participants</h2>
            {participants.map(p => (
              <div key={p.id} className="flex items-center space-x-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
                  {p.name[0]}
                </div>
                <span className="text-white">{p.name} {isCurrentUserParticipant(p) && '(You)'}</span>
              </div>
            ))}
          </div>
        )}

        {isTranslationPanelOpen && <TranslationPanel onClose={() => setIsTranslationPanelOpen(false)} />}
      </div>

      {isScreenSharing && <div className="absolute bottom-4 left-20 z-40">
        <ScreenShare
          stream={stream}
          sessionId={roomId}
          onStart={async (displayStream) => {
            try {
              displayStream.getTracks().forEach(t => {
                peerRef.current.addTrack(t, displayStream);
              });
              
              const offer = await peerRef.current.createOffer();
              await peerRef.current.setLocalDescription(offer);
              if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'offer', sdp: offer }));
            } catch (e) { 
              console.error('❌ Screen share error:', e); 
            }
          }}
          onStop={async () => {
            try {
              peerRef.current.getSenders().forEach(sender => {
                if (sender.track && sender.track.kind === 'video') {
                  sender.replaceTrack(null).catch(() => {});
                }
              });
              
              const offer = await peerRef.current.createOffer();
              await peerRef.current.setLocalDescription(offer);
              if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'offer', sdp: offer }));
            } catch (e) { 
              console.error('❌ Stop screen share error:', e); 
            }
          }}
        />
      </div>}

      {sharingUser && (
        <div className="absolute top-16 right-4 z-30 w-[420px] h-[260px] bg-black rounded-lg overflow-hidden shadow-xl border border-gray-700">
          <div className="text-xs text-white bg-black/60 px-2 py-1">{sharingUser.fullName} is presenting…</div>
          <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#2E4242] p-8 rounded-xl shadow-2xl text-white max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Audio/Video Settings</h2>
              <button onClick={toggleSettings} className="text-gray-400 hover:text-white text-3xl">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

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