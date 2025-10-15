// src/components/TranslationPanel.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Import the new toggle icons
import { 
    faTimes, 
    faCommentDots, 
    faClosedCaptioning, 
    faBookOpen,
    faToggleOn, // Used for the ON state
    faToggleOff // Used for the OFF state
} from '@fortawesome/free-solid-svg-icons'; 

// 1. ACCEPT NEW PROPS: isTranslatedCaptionsOn and onCaptionToggle
function TranslationPanel({ onClose, isTranslatedCaptionsOn, onCaptionToggle }) {
  // State to track which tab is currently active: 'translatedChat', 'transcription', or 'summary'
  const [activeTab, setActiveTab] = useState('transcription'); 

  // Helper function to simplify the toggle logic
  const handleCaptionToggleClick = () => {
      // Call the parent's handler, which will update the state
      // and close this panel (as required by the user story)
      onCaptionToggle(!isTranslatedCaptionsOn);
  };
  
  return (
    // Main panel container fixed to the right side
    <div className="absolute top-0 right-0 h-full w-80 z-50 bg-[#1E1F21] shadow-xl flex flex-col transition-transform duration-300">
      
      {/* Header and Close Button */}
      <div className="flex justify-between items-center p-4 bg-[#2E4242] text-white">
        <h2 className="text-xl font-bold">Meeting Tools</h2>
        <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl" title="Close Panel">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Tab Navigation Bar */}
      <div className="flex bg-[#2E4242] border-b border-gray-700">
        <button
          className={`flex-1 p-3 text-center text-sm font-semibold transition-colors ${
            activeTab === 'translatedChat' ? 'text-white border-b-2 border-yellow-400' : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('translatedChat')}
          title="Translated Chat"
        >
          <FontAwesomeIcon icon={faCommentDots} className="mr-1" /> Chat
        </button>
        <button
          className={`flex-1 p-3 text-center text-sm font-semibold transition-colors ${
            activeTab === 'transcription' ? 'text-white border-b-2 border-yellow-400' : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('transcription')}
          title="Transcription"
        >
          <FontAwesomeIcon icon={faClosedCaptioning} className="mr-1" /> Transcript
        </button>
        <button
          className={`flex-1 p-3 text-center text-sm font-semibold transition-colors ${
            activeTab === 'summary' ? 'text-white border-b-2 border-yellow-400' : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('summary')}
          title="Summary"
        >
          <FontAwesomeIcon icon={faBookOpen} className="mr-1" /> Summary
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 p-4 overflow-y-auto text-white">
        
        {/* Translated Chat Content */}
        {activeTab === 'translatedChat' && (
          <div>
            <h3 className="text-lg font-bold mb-3 text-yellow-400">Translated Chat</h3>
            <p className="text-sm text-gray-400 mt-10 text-center">
              Awaiting translated chat messages...
            </p>
          </div>
        )}

        {/* Transcription Content (UPDATED) */}
        {activeTab === 'transcription' && (
          <div>
            <h3 className="text-lg font-bold mb-3 text-yellow-400">Live Transcription</h3>

                {/* 2. CAPTION TOGGLE UI */}
                <div className="flex items-center justify-between p-3 mb-4 bg-[#2E4242] rounded-lg border border-gray-600">
                    <span className="text-sm font-semibold">Translated Captions</span>
                    <button
                        onClick={handleCaptionToggleClick}
                        className={`text-3xl transition-colors ${isTranslatedCaptionsOn ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                        title={isTranslatedCaptionsOn ? "Turn Captions Off" : "Turn Captions On (Closes Panel)"}
                    >
                        {/* Conditional icon display */}
                        <FontAwesomeIcon icon={isTranslatedCaptionsOn ? faToggleOn : faToggleOff} />
                    </button>
                </div>
                {/* END CAPTION TOGGLE UI */}
            
            <p className="text-sm text-gray-400 mt-10 text-center">
              Transcription will appear here as the conversation progresses...
            </p>
          </div>
        )}

        {/* Summary Content */}
        {activeTab === 'summary' && (
          <div>
            <h3 className="text-lg font-bold mb-3 text-yellow-400">AI Meeting Summary</h3>
            <p className="text-sm text-gray-400 mt-10 text-center">
              The AI summary and action items will generate once the meeting is complete or upon request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TranslationPanel;