// src/components/TranslationPanel.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCommentDots, faClosedCaptioning, faBookOpen } from '@fortawesome/free-solid-svg-icons'; 

function TranslationPanel({ onClose }) {
  // State to track which tab is currently active: 'translatedChat', 'transcription', or 'summary'
  const [activeTab, setActiveTab] = useState('translatedChat'); 

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

      {/* Tab Content Area (Cleaned) */}
      <div className="flex-1 p-4 overflow-y-auto text-white">
        
        {/* Translated Chat Content */}
        {activeTab === 'translatedChat' && (
          <div>
            <h3 className="text-lg font-bold mb-3 text-yellow-400">Translated Chat</h3>
            {/* The live, translated chat messages will render here */}
            <p className="text-sm text-gray-400 mt-10 text-center">
              Awaiting translated chat messages...
            </p>
          </div>
        )}

        {/* Transcription Content */}
        {activeTab === 'transcription' && (
          <div>
            <h3 className="text-lg font-bold mb-3 text-yellow-400">Live Transcription</h3>
            {/* The real-time transcription will render here */}
            <p className="text-sm text-gray-400 mt-10 text-center">
              Transcription will appear here as the conversation progresses...
            </p>
          </div>
        )}

        {/* Summary Content */}
        {activeTab === 'summary' && (
          <div>
            <h3 className="text-lg font-bold mb-3 text-yellow-400">AI Meeting Summary</h3>
            {/* The AI-generated summary, action items, etc., will render here */}
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