import { useRef, useState } from "react";
import { MonitorUp, MonitorX } from "lucide-react";

export default function ScreenShare({ sessionId, onStart, onStop }) {
  const [isSharing, setIsSharing] = useState(false);
  const displayStreamRef = useRef(null);
  const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8000";

  const handleScreenShare = async () => {
    try {
      if (!isSharing) {
        // Start screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        displayStreamRef.current = stream;
        if (onStart) {
          try { onStart(stream); } catch (_) {}
        }

        // Call backend to mark screen sharing started
        const token = sessionStorage.getItem("access_token");
        if (token && sessionId) {
          await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/screenshare/start`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          }).catch(() => {});
        }

        setIsSharing(true);
      } else {
        // Stop screen share
        if (displayStreamRef.current) {
          displayStreamRef.current.getTracks().forEach(t => t.stop());
          displayStreamRef.current = null;
        }
        if (onStop) {
          try { onStop(); } catch (_) {}
        }

        // Call backend to mark screen sharing stopped
        const token = sessionStorage.getItem("access_token");
        if (token && sessionId) {
          await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/screenshare/stop`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          }).catch(() => {});
        }

        setIsSharing(false);
      }
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  return (
    <button
      onClick={handleScreenShare}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition ${
        isSharing ? "bg-red-500 text-white" : "bg-blue-500 text-white"
      }`}
    >
      {isSharing ? (
        <>
          <MonitorX size={18} /> Stop Share
        </>
      ) : (
        <>
          <MonitorUp size={18} /> Share Screen
        </>
      )}
    </button>
  );
}
