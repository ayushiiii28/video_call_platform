import { useState } from "react";
import { MonitorUp, MonitorX } from "lucide-react";

export default function ScreenShare() {
  const [isSharing, setIsSharing] = useState(false);

  const handleScreenShare = async () => {
    try {
      if (!isSharing) {
        // Start screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        console.log("Screen sharing started:", stream);
        // TODO: attach this stream to your peer connection (WebRTC)
        setIsSharing(true);
      } else {
        // Stop screen share
        // If using WebRTC, you'd stop sending the track here
        console.log("Screen sharing stopped");
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
