import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

export default function Recording({ stream, sessionId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8000";

  useEffect(() => {
    if (!stream) {
      setError("No active media stream. Grant camera/mic access to record.");
    } else {
      setError("");
    }
  }, [stream]);

  const toggleRecording = async () => {
    if (!stream) {
      setError("Cannot record: no active media stream.");
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("You must be logged in to record.");
      return;
    }

    if (!isRecording) {
      try {
        // Call backend to start recording
        const res = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/recording/start`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const maybeJson = await res.json().catch(() => null);
          const detail = maybeJson?.detail || "Failed to start recording.";
          throw new Error(Array.isArray(detail) ? detail[0]?.msg || "Failed to start recording." : detail);
        }
        recordedChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (err) {
        console.error("Recording error:", err);
        setError(err?.message || "Recording failed. Check permissions.");
      }
    } else {
      try {
        // Stop client recording and optionally send/handle upload if needed
        mediaRecorderRef.current.stop();
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        // Optionally could upload to your backend if desired

        // Call backend to stop recording and finalize
        const res = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/recording/stop`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const maybeJson = await res.json().catch(() => null);
          const detail = maybeJson?.detail || "Failed to stop recording.";
          throw new Error(Array.isArray(detail) ? detail[0]?.msg || "Failed to stop recording." : detail);
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recording_${Date.now()}.webm`;
        a.click();
        setIsRecording(false);
      } catch (err) {
        console.error("Stop recording error:", err);
        setError(err?.message || "Failed to stop recording.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={toggleRecording}
        disabled={!stream}
        className={`text-2xl transition-colors duration-200 ${
          isRecording ? "text-red-500" : "text-gray-400 hover:text-white"
        } ${!stream ? "opacity-50 cursor-not-allowed" : ""}`}
        title={!stream ? "Media not ready" : isRecording ? "Stop Recording" : "Start Recording"}
      >
        <FontAwesomeIcon icon={faCircle} />
      </button>
      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
    </div>
  );
}
