import { useState } from "react";

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input }]);
    setInput("");
  };

  return (
    <div className="w-80 border-l flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-3 bg-gray-200 border-b font-semibold">
        Chat
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm">No messages yet.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-white p-2 rounded shadow-sm break-words"
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex p-3 border-t bg-gray-200"
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-2 py-1 focus:outline-none"
        />
        <button
          type="submit"
          className="ml-2 p-2 bg-blue-500 text-white rounded flex items-center justify-center"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
}
