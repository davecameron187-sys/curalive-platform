import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { 
  MessageSquare, 
  BarChart2, 
  Mic, 
  Video, 
  Send, 
  Phone, 
  Wifi, 
  Info,
  ChevronRight,
  User,
  ExternalLink,
  CheckCircle2,
  Clock,
  Globe,
  ThumbsUp,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2
} from "lucide-react";
import SwipeablePanel from "@/components/mobile/SwipeablePanel";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "video", label: "Live", icon: Video },
  { id: "transcript", label: "Transcript", icon: Mic },
  { id: "qa", label: "Q&A", icon: MessageSquare },
  { id: "polls", label: "Polls", icon: BarChart2 },
  { id: "info", label: "Info", icon: Info },
];

const LANGUAGES = [
  { code: "EN", name: "English" },
  { code: "AF", name: "Afrikaans" },
  { code: "ZU", name: "isiZulu" },
  { code: "XH", name: "isiXhosa" },
  { code: "FR", name: "French" },
  { code: "DE", name: "German" },
];

export default function AttendeeRoom() {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [voterSession] = useState(() => Math.random().toString(36).slice(2));
  const [sentiment, setSentiment] = useState(75); // Mock live sentiment
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const { data: event } = trpc.events.getEvent.useQuery({ eventId: eventId ?? "" });
  const { data: activePoll } = trpc.polls.getActive.useQuery({ eventId: eventId ?? "" }, { refetchInterval: 5000 });
  const { data: pollResults, refetch: refetchResults } = trpc.polls.getResults.useQuery(
    { pollId: activePoll?.poll.id ?? 0 },
    { enabled: !!activePoll?.poll.id, refetchInterval: 3000 }
  );

  const { data: transcriptSegments = [] } = trpc.transcription.getTranscript.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId, refetchInterval: 5000 }
  );

  const vote = trpc.polls.vote.useMutation({
    onSuccess: () => refetchResults(),
  });

  const totalVotes = pollResults?.totalVotes ?? 0;

  // Auto-scroll transcript logic
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && transcriptEndRef.current && activeTab === 1) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [autoScroll, activeTab, transcriptSegments]);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  const mockQuestions = [
    { id: 1, author: "David M.", text: "How do you see the margin profile evolving in H1 2026?", votes: 12, answered: true },
    { id: 2, author: "Sarah L.", text: "What is the expected impact of the new regulatory changes on the SME segment?", votes: 8, answered: false },
    { id: 3, author: "Robert K.", text: "Can you provide more detail on the capital allocation strategy for the next 18 months?", votes: 5, answered: false },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-200 flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-teal-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight truncate max-w-[180px]">{event?.title || "Loading event..."}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{event?.company || "CuraLive"}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 py-0.5 px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold">LIVE</span>
        </Badge>
      </div>

      {/* Main Swipeable Content */}
      <SwipeablePanel activeIndex={activeTab} onChange={handleTabChange}>
        {/* Panel 1: Video */}
        <div className="h-full flex flex-col">
          <div className="bg-black aspect-video w-full flex items-center justify-center relative shrink-0">
             {/* Mux Player Placeholder */}
             <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
                <Video className="w-12 h-12 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-medium">HLS Stream Connection Pending</p>
                
                {/* Mock Video Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                      </button>
                      <button onClick={() => setIsMuted(!isMuted)}>
                        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                      </button>
                    </div>
                    <button>
                      <Maximize2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
             </div>
             {/* Sentiment Overlay */}
             <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 transition-all duration-1000 relative"
                  style={{ width: `${sentiment}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
             </div>
          </div>
          
          <div className="flex-1 p-5 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <Avatar key={i} className="w-6 h-6 border-2 border-slate-950">
                      <AvatarFallback className="text-[8px] bg-slate-800">U{i}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-slate-500">1,248 watching</span>
              </div>
              <Badge variant="outline" className="border-teal-500/30 text-teal-400 bg-teal-500/5">
                <Wifi className="w-3 h-3 mr-1" /> HD
              </Badge>
            </div>

            <div className="space-y-3">
               <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="bg-slate-900 border-slate-800 h-auto py-4 flex-col gap-2 items-center hover:bg-slate-800 transition-colors">
                    <Phone className="w-5 h-5 text-teal-400" />
                    <span className="text-[11px] font-bold">Dial-In Support</span>
                  </Button>
                  <Button variant="secondary" className="bg-slate-900 border-slate-800 h-auto py-4 flex-col gap-2 items-center hover:bg-slate-800 transition-colors">
                    <ExternalLink className="w-5 h-5 text-teal-400" />
                    <span className="text-[11px] font-bold">View Slide Deck</span>
                  </Button>
               </div>
            </div>
            
            <Card className="bg-slate-900 border-slate-800 p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border border-slate-700">
                  <AvatarFallback className="bg-teal-500/20 text-teal-400 font-bold text-lg">JW</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">James Wilson</p>
                    <Badge className="bg-teal-500 text-[8px] px-1 py-0 h-3">SPEAKER</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">CEO, TechFlow Solutions</p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Speaking Progress</span>
                  <span className="text-[10px] text-slate-400 font-mono">12:45 / 45:00</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[35%] h-full bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Panel 2: Transcript */}
        <div className="h-full flex flex-col p-4 relative">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-white">Live Transcript</h2>
            <div className="flex gap-2">
               <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                  {LANGUAGES.slice(0, 3).map(lang => (
                    <button 
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                        selectedLanguage === lang.code ? "bg-teal-500 text-white" : "text-slate-500"
                      )}
                    >
                      {lang.code}
                    </button>
                  ))}
               </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 pr-4 -mr-4" onScroll={(e) => {
            const target = e.currentTarget;
            const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
            setAutoScroll(isAtBottom);
          }}>
            <div className="space-y-6 pb-20">
              {(transcriptSegments as any[]).length > 0 ? (
                (transcriptSegments as any[]).map((seg: any, i: number) => (
                  <div key={i} className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                        seg.speaker.toLowerCase().includes('ceo') ? "bg-teal-500/10 text-teal-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {seg.speaker}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600">{seg.timeLabel}</span>
                    </div>
                    <p className="text-[15px] text-slate-300 leading-relaxed font-medium">
                      {seg.text}
                      {seg.confidence < 0.8 && <span className="inline-block w-1.5 h-1.5 bg-yellow-500/50 rounded-full ml-1" title="Low confidence" />}
                    </p>
                  </div>
                ))
              ) : (
                <div className="space-y-6">
                  {[
                    { speaker: "CEO", text: "Good morning, and welcome to our Q4 2025 earnings call. We're pleased to report strong results across all business units.", time: "09:01" },
                    { speaker: "CFO", text: "Revenue for the quarter came in at R4.2 billion, representing 18% year-on-year growth, ahead of analyst consensus.", time: "09:08" },
                    { speaker: "CEO", text: "Our CuraLive platform achieved record adoption with over 340 institutional investors joining this call alone.", time: "09:15" },
                    { speaker: "CEO", text: "Looking ahead, we are increasing our full-year guidance as we see continued momentum in our core infrastructure segments.", time: "09:22" },
                    { speaker: "CFO", text: "We have also maintained strong cost discipline, allowing us to expand margins even during this growth phase.", time: "09:30" },
                  ].map((seg, i) => (
                    <div key={i} className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                          seg.speaker === 'CEO' ? "bg-teal-500/10 text-teal-400" : "bg-blue-500/10 text-blue-400"
                        )}>
                          {seg.speaker}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600">{seg.time}</span>
                      </div>
                      <p className="text-[15px] text-slate-300 leading-relaxed font-medium">{seg.text}</p>
                    </div>
                  ))}
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </ScrollArea>
          
          {!autoScroll && (
            <Button 
              size="sm" 
              className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full shadow-2xl bg-teal-600 hover:bg-teal-500 gap-2 px-5 py-5 h-auto z-20 border-2 border-white/10"
              onClick={() => setAutoScroll(true)}
            >
              <ChevronRight className="w-4 h-4 rotate-90" />
              <span className="text-xs font-bold uppercase tracking-wider">Jump to Live</span>
            </Button>
          )}
        </div>

        {/* Panel 3: Q&A */}
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center justify-between shrink-0 bg-slate-900/50 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Q&A Session</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold py-0.5 border-teal-500/30 text-teal-400 bg-teal-500/5">Active</Badge>
              <Badge variant="outline" className="text-[10px] font-bold py-0.5 border-slate-700 text-slate-400">Moderated</Badge>
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-6 pb-24">
              {mockQuestions.map((q) => (
                <Card key={q.id} className="bg-slate-900 border-slate-800 p-4 relative overflow-hidden group">
                  {q.answered && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-tighter rounded-bl-lg">
                      Answered
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 border border-slate-800">
                        <AvatarFallback className="text-[8px] bg-slate-800">{q.author[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-slate-300">{q.author}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5 text-slate-500 hover:text-teal-400 hover:bg-teal-400/5 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="text-xs font-mono">{q.votes}</span>
                    </Button>
                  </div>
                  <p className="text-[13px] text-slate-400 leading-relaxed font-medium pr-8">{q.text}</p>
                </Card>
              ))}

              {submitted && (
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-6 text-center animate-in zoom-in-95 duration-300 my-4 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">Question Submitted</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Your question has been sent to the moderator. It will appear here if selected for the live session.
                  </p>
                  <Button variant="outline" size="sm" className="border-slate-800 bg-slate-900 hover:bg-slate-800" onClick={() => setSubmitted(false)}>
                    Ask another question
                  </Button>
                </div>
              )}
              
              {!submitted && mockQuestions.length === 0 && (
                <div className="text-center py-20 px-10 opacity-50">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-8 h-8 text-slate-700" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">No public questions yet</p>
                  <p className="text-xs text-slate-500 mt-2">Questions will appear here once approved by the moderator.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-lg border-t border-slate-900 safe-area-bottom z-10">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 pr-16 text-[15px] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all resize-none min-h-[56px] max-h-32 shadow-2xl"
                rows={1}
                maxLength={280}
              />
              <button
                onClick={() => { if (question.trim()) { setSubmitted(true); setQuestion(""); } }}
                disabled={!question.trim()}
                className="absolute right-2.5 bottom-2.5 w-10 h-10 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white flex items-center justify-center transition-all transform active:scale-90 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2.5 px-1">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                Moderated Session
              </p>
              <p className={cn(
                "text-[10px] font-mono",
                question.length > 250 ? "text-amber-500" : "text-slate-600"
              )}>{question.length}/280</p>
            </div>
          </div>
        </div>

        {/* Panel 4: Polls */}
        <div className="h-full flex flex-col p-4">
          <h2 className="text-lg font-bold text-white mb-6">Interactive Polls</h2>
          
          {!activePoll ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
              <div className="w-24 h-24 bg-slate-900/50 rounded-[40px] flex items-center justify-center mb-8 border border-slate-800 relative">
                <BarChart2 className="w-10 h-10 text-slate-700" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 rounded-full animate-ping opacity-20" />
              </div>
              <p className="text-sm font-bold text-slate-300">Awaiting interactive polls</p>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Polls will automatically appear here when launched by the management team.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <Badge className="bg-teal-500/10 text-teal-400 px-3 py-1 border-none text-[10px] font-black tracking-widest">ACTIVE POLL</Badge>
                  <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500/50 w-full animate-progress-shrink origin-left" style={{ animationDuration: '30s' }} />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white leading-tight mb-10">
                  {activePoll.poll.question}
                </h3>
                
                <div className="space-y-4">
                  {activePoll.options.map((opt) => {
                    const votes = pollResults?.options.find(o => o.id === opt.id)?.votes ?? 0;
                    const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => vote.mutate({ pollId: activePoll.poll.id, optionId: opt.id, voterSession })}
                        className="w-full text-left bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-2xl p-5 transition-all relative overflow-hidden group active:scale-[0.98] min-h-[64px]"
                      >
                        <div className="absolute inset-y-0 left-0 bg-teal-500/10 transition-all duration-700" style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between">
                          <span className="text-[15px] font-bold text-slate-200 group-hover:text-white transition-colors">{opt.optionText}</span>
                          <span className="text-sm font-mono font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-lg">{pct}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900" />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{totalVotes} VOTES</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel 5: Info */}
        <div className="h-full flex flex-col p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-white mb-6">Event Details</h2>
          
          <div className="space-y-8 pb-10">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Summary</h3>
              <p className="text-[15px] text-slate-400 leading-relaxed font-medium">
                {event?.title} results briefing. Join management for a detailed review of financial performance, 
                strategic progress, and updated guidance for the fiscal year 2026.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Key Speakers</h3>
              <div className="space-y-3">
                {[
                  { name: "James Wilson", title: "CEO", company: "TechFlow Solutions" },
                  { name: "Sarah Chen", title: "CFO", company: "TechFlow Solutions" }
                ].map((speaker, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 group hover:border-slate-700 transition-colors">
                    <Avatar className="w-11 h-11 border-2 border-slate-800 group-hover:border-teal-500/50 transition-colors">
                      <AvatarFallback className="bg-slate-800 text-teal-400 font-black">{speaker.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{speaker.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">{speaker.title} — {speaker.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Dial-In Numbers</h3>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-[24px] overflow-hidden shadow-2xl">
                {[
                  { country: "South Africa", number: "+27 11 012 3456", type: "Toll-Free" },
                  { country: "United Kingdom", number: "+44 20 7123 4567", type: "Standard" },
                  { country: "United States", number: "+1 212 555 0123", type: "Standard" }
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-5 flex justify-between items-center",
                    i !== 2 && "border-b border-slate-800/50"
                  )}>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{item.country}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{item.type}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-400/5 px-3 py-2 rounded-xl border border-teal-500/10">
                      {item.number}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-6 text-center">
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em]">Powered by CuraLive IR</p>
            </div>
          </div>
        </div>
      </SwipeablePanel>

      {/* Bottom Navigation */}
      <div className="bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 flex safe-area-bottom shrink-0 h-[84px] relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {TABS.map(({ id, label, icon: Icon }, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all relative overflow-hidden",
                isActive ? "text-teal-400" : "text-slate-600"
              )}
            >
              {isActive && (
                <>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-teal-500 rounded-b-full shadow-[0_2px_10px_rgba(20,184,166,0.5)]" />
                  <div className="absolute inset-0 bg-teal-500/5 animate-pulse" />
                </>
              )}
              <Icon className={cn(
                "w-6 h-6 transition-transform duration-300",
                isActive ? "scale-110 stroke-[2.5px]" : "scale-100 stroke-[2px]"
              )} />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-all",
                isActive ? "opacity-100 translate-y-0" : "opacity-60"
              )}>{label}</span>
              
              {id === "polls" && activePoll && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute top-4 right-1/4 border-2 border-slate-900 shadow-lg animate-bounce" />
              )}
              {id === "qa" && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400/40 absolute top-5 right-1/3" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

