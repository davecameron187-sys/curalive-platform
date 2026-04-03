import { useState } from "react";
import { trpc } from "../lib/trpc";

interface SessionSchedulerProps {
  sessionId: number;
  currentScheduledAt?: string | null;
  onScheduled?: () => void;
}

export function SessionScheduler({ sessionId, currentScheduledAt, onScheduled }: SessionSchedulerProps) {
  const now = new Date();
  const defaultDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const [eventName, setEventName] = useState("");
  const [company, setCompany] = useState("");
  const [date, setDate] = useState(currentScheduledAt || defaultDate.toISOString().slice(0, 16));
  const [meetingUrl, setMeetingUrl] = useState("");

  const scheduleSession = trpc.sessionConfig.scheduleSession.useMutation({
    onSuccess: () => onScheduled?.(),
  });

  const handleSchedule = () => {
    if (!eventName.trim()) return;
    scheduleSession.mutate({
      eventName: eventName.trim(),
      company: company.trim() || undefined,
      scheduledAt: new Date(date).toISOString(),
      meetingUrl: meetingUrl.trim() || undefined,
    });
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Schedule Session</h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Event Name *</label>
          <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Q2 Earnings Call" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Company</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Event Date & Time</label>
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Meeting URL (optional)</label>
          <input value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/j/..." className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>

        {currentScheduledAt && (
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-300">
            <span className="text-gray-500">Currently scheduled:</span>{" "}
            {new Date(currentScheduledAt).toLocaleString()}
          </div>
        )}

        <button
          onClick={handleSchedule}
          disabled={scheduleSession.isPending || !eventName.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {scheduleSession.isPending ? "Scheduling..." : "Schedule Session"}
        </button>

        {scheduleSession.isSuccess && (
          <p className="text-xs text-green-400 text-center">Session scheduled successfully.</p>
        )}
      </div>
    </div>
  );
}
