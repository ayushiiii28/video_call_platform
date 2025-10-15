import { useEffect, useRef, useState } from "react";

export default function ChatBox({ sessionId, selfName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8000";
  const listEndRef = useRef(null);
  const tokenRef = useRef(null);

  // Load chat history
  useEffect(() => {
    tokenRef.current = sessionStorage.getItem("access_token");
    if (!tokenRef.current || !sessionId) return;

    let isMounted = true;
    let pollId;

    const loadHistory = async () => {
      try {
      const res = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/chat/`, {
          headers: { "Authorization": `Bearer ${tokenRef.current}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = (data?.data || []).map(m => ({ id: m.id, text: `${m.user_full_name}: ${m.content}` }));
        if (isMounted) setMessages(list);
      } catch (_e) { /* ignore */ }
    };

    loadHistory();
    pollId = setInterval(loadHistory, 2000);

    return () => {
      isMounted = false;
      if (pollId) clearInterval(pollId);
    };
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/chat/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: input })
      });
      if (!res.ok) return;
      const saved = await res.json();
      setMessages(prev => [...prev, { id: saved.id, text: `${saved.user_full_name || selfName}: ${saved.content}` }]);
      setInput("");
    } catch (_e) {
      // ignore errors
    }
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
        <div ref={listEndRef} />
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
