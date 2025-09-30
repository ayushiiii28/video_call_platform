import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

export default function Recording({ stream }) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    if (!stream) {
      setError("No active media stream. Grant camera/mic access to record.");
    } else {
      setError("");
    }
  }, [stream]);

  const toggleRecording = () => {
    if (!stream) {
      setError("Cannot record: no active media stream.");
      return;
    }

    if (!isRecording) {
      try {
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
        setError("Recording failed. Check permissions.");
      }
    } else {
      mediaRecorderRef.current.stop();
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording_${Date.now()}.webm`;
      a.click();
      setIsRecording(false);
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
