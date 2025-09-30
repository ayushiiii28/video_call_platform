import React, { useState } from "react";

export default function Schedule() {
  const [meetings, setMeetings] = useState([
    { id: 1, title: "Team Sync", date: "2025-10-02", time: "10:00 AM" },
    { id: 2, title: "Project Review", date: "2025-10-03", time: "02:00 PM" },
  ]);

  const [newMeeting, setNewMeeting] = useState({ title: "", date: "", time: "" });

  const handleAddMeeting = (e) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time) return;
    setMeetings([...meetings, { ...newMeeting, id: Date.now() }]);
    setNewMeeting({ title: "", date: "", time: "" });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Scheduled Meetings</h2>

      {/* Add Meeting Form */}
      <form onSubmit={handleAddMeeting} className="mb-6 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Meeting Title"
          value={newMeeting.title}
          onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
          className="border rounded px-3 py-2 flex-1 focus:outline-none"
        />
        <input
          type="date"
          value={newMeeting.date}
          onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
          className="border rounded px-3 py-2 focus:outline-none"
        />
        <input
          type="time"
          value={newMeeting.time}
          onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
          className="border rounded px-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </form>

      {/* Meeting List */}
      <div className="grid gap-4">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-lg">{meeting.title}</h3>
              <p className="text-gray-500">{meeting.date} • {meeting.time}</p>
            </div>
            <button className="text-red-500 hover:text-red-700 font-semibold">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
