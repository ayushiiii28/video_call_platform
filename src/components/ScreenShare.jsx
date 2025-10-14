// ScreenShare.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';

/**
 * Button component to handle screen sharing logic and state updates.
 */
export default function ScreenShare({ isSharing, setIsSharing, setScreenStream }) {

    const handleScreenShare = async () => {
        try {
            if (!isSharing) {
                // Start screen share
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true, 
                });
                
                setScreenStream(stream);
                setIsSharing(true);

                // Listen for when the user stops sharing via the browser's native UI button
                const screenTrack = stream.getVideoTracks()[0];
                screenTrack.onended = () => {
                    setIsSharing(false);
                    setScreenStream(null);
                    console.log("Screen sharing stopped by browser UI.");
                };

                console.log("Screen sharing started:", stream);
            } else {
                // Stop screen share by stopping all tracks and clearing state
                setScreenStream(prevStream => {
                    if (prevStream) {
                        prevStream.getTracks().forEach(track => track.stop());
                    }
                    return null;
                });
                setIsSharing(false);
                console.log("Screen sharing stopped by button.");
            }
        } catch (err) {
            // User denied permission or an error occurred
            console.error("Error sharing screen:", err);
            setIsSharing(false);
            setScreenStream(null);
        }
    };

    return (
        <button 
            onClick={handleScreenShare} 
            className={`text-2xl ${isSharing ? 'text-green-400' : 'text-gray-400 hover:text-white'}`} 
            title={isSharing ? "Stop Sharing" : "Share Screen"}
        >
            <FontAwesomeIcon icon={faDesktop} />
        </button>
    );
}