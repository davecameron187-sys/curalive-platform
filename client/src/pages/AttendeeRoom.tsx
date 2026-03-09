import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { MessageSquare, BarChart2, Mic, Video, ChevronLeft, ChevronRight, Send, Phone, Wifi, WifiOff } from "lucide-react";

const TABS = [
  { id: "video", label: "Live", icon: Video },
  { id: "transcript", label: "Transcript", icon: Mic },
  { id: "qa", label: "Q&A", icon: MessageSquare },
  { id: "polls", label: "Polls", icon: BarChart2 },
];

export default function AttendeeRoom() {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState("video");
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [voterSession] = useState(() => Math.random().toString(36).slice(2));

  const { data: activePoll } = trpc.polls.getActive.useQuery({ eventId: eventId ?? "" }, { refetchInterval: 5000 });
  const { data: pollResults, refetch: refetchResults } = trpc.polls.getResults.useQuery(
    { pollId: activePoll?.poll.id ?? 0 },
    { enabled: !!activePoll?.poll.id, refetchInterval: 3000 }
  );

  const vote = trpc.polls.vote.useMutation({
    onSuccess: () => refetchResults(),
  });

  const totalVotes = pollResults?.totalVotes ?? 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col max-w-md mx-auto">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">CuraLive Event</p>
          <p className="text-xs text-slate-400">{eventId}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Wifi className="w-3.5 h-3.5" />
          Live
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "video" && (
          <div className="flex-1 flex flex-col">
            <div className="bg-black aspect-video flex items-center justify-center">
              <div className="text-center">
                <Video className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Live stream will appear here</p>
                <p className="text-xs text-slate-600 mt-1">Connect from the event room for video</p>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-300 mb-1">Audio Dial-In</p>
                <p className="text-xs text-slate-400">Join by phone for audio-only access. Dial-in numbers available once event starts.</p>
                <button className="mt-2 flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                  <Phone className="w-3.5 h-3.5" /> View Dial-In Numbers
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transcript" && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <p className="text-xs text-slate-500 text-center py-2">Live transcript</p>
            {[
              { speaker: "CEO", text: "Good morning, and welcome to our Q4 2025 earnings call. We're pleased to report strong results across all business units.", time: "09:01" },
              { speaker: "CFO", text: "Revenue for the quarter came in at R4.2 billion, representing 18% year-on-year growth, ahead of analyst consensus.", time: "09:08" },
              { speaker: "CEO", text: "Our CuraLive platform achieved record adoption with over 340 institutional investors joining this call alone.", time: "09:15" },
            ].map((seg, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-teal-400">{seg.speaker}</span>
                  <span className="text-xs text-slate-600">{seg.time}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "qa" && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <p className="text-xs text-slate-500 text-center">Submit your question below. The moderator will select questions to answer live.</p>
              {submitted && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-300">
                  Your question has been submitted and is pending review.
                </div>
              )}
            </div>
            <div className="border-t border-slate-700 p-4">
              {!submitted ? (
                <div className="flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    maxLength={280}
                  />
                  <button
                    onClick={() => { if (question.trim()) setSubmitted(true); }}
                    disabled={!question.trim()}
                    className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 rounded-lg text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setSubmitted(false); setQuestion(""); }} className="w-full text-xs text-slate-400 text-center">
                  Submit another question
                </button>
              )}
              <p className="text-xs text-slate-600 mt-1.5 text-right">{question.length}/280</p>
            </div>
          </div>
        )}

        {activeTab === "polls" && (
          <div className="flex-1 p-4">
            {!activePoll ? (
              <div className="text-center py-12">
                <BarChart2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm text-slate-500">No active poll right now</p>
                <p className="text-xs text-slate-600 mt-1">Check back during the event</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-800/60 rounded-lg p-4">
                  <p className="text-sm font-semibold text-white mb-4">{activePoll.poll.question}</p>
                  <div className="space-y-2">
                    {activePoll.options.map((opt) => {
                      const votes = pollResults?.options.find(o => o.id === opt.id)?.votes ?? 0;
                      const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => vote.mutate({ pollId: activePoll.poll.id, optionId: opt.id, voterSession })}
                          className="w-full text-left bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-3 transition-colors relative overflow-hidden"
                        >
                          <div className="absolute inset-y-0 left-0 bg-teal-500/20 transition-all" style={{ width: `${pct}%` }} />
                          <div className="relative flex items-center justify-between">
                            <span className="text-sm text-white">{opt.optionText}</span>
                            <span className="text-xs text-teal-400 font-medium">{pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-right">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800 border-t border-slate-700 flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${activeTab === id ? "text-teal-400" : "text-slate-500"}`}
          >
            <Icon className="w-5 h-5" />
            {label}
            {id === "polls" && activePoll && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 absolute mt-0.5 ml-3" />}
          </button>
        ))}
      </div>
    </div>
  );
}
